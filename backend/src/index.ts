import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { parse } from 'csv-parse/sync';

// 1. Setup Environment (Reads from your .env file)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


// 2. Middleware
app.use(cors({ origin: 'https://zuzanitta.github.io' }));          // Allows your Frontend to talk to this Backend
app.use(express.json());  // Allows Backend to read JSON sent by Frontend

// 3. Define Types (The "Contract" for your data)
type SlotStatus = 'available' | 'booked' | 'locked';

interface TimeSlot {
  time: string;       // e.g., "10:00"
  status: SlotStatus;
  userId: string;    // Store who booked it
  price: number;      // In Spain, peak hours (18:00+) are often more expensive
}

interface Court {
  id: number;
  name: string;
  slots: TimeSlot[];
}

// 4. Mock Data (Temporary "Database" in memory)
const START_HOUR = 10;
const END_HOUR = 22;

function generateDaySlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let i = START_HOUR; i <= END_HOUR; i++) {
    const timeLabel = `${i}:00`;
    slots.push({
      time: timeLabel,
      status: 'available',
      userId: '0',
      price: i >= 18 ? 20 : 15 // Example: €20 after 6pm, €15 before
    });
  }
  return slots;
}

// Initialize our "Database" with 3 courts
let courts: Court[] = [
  { id: 1, name: "Pista 1", slots: generateDaySlots() },
  { id: 2, name: "Pista 2", slots: generateDaySlots() },
  { id: 3, name: "Pista 3", slots: generateDaySlots() },
];

// Transform CSV data into Court[] structure
function transformCsvToGrid(records: any[]): Court[] {
  // Map CSV records to Court objects
  return records.map((record: any, index: number) => ({
    id: index + 1,
    name: record.name || `Pista ${index + 1}`,
    slots: generateDaySlots()
  }));
}

// --- ROUTES ---

// A. Health Check
app.get('/', (req: Request, res: Response) => {
  res.send('🏸 Badminton Reserve API is running!');
});

// B. Get all courts (Frontend will call this to draw the grid)
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQRV8M-vYaXiga7SHxmV1QLQHx03lRh1uoIwkIVsPMNPR-sa7appOB70e-1FtP4IBU26oEtveKqG1_3/pub?gid=0&single=true&output=csv";

app.get('/api/courts', async (req, res) => {
  try {
    // 1. Explicitly tell Axios to expect a string
    const response = await axios.get<string>(SHEET_CSV_URL);
    
    // 2. Tell the parser that response.data is definitely a string
    const records = parse(response.data as string, {
      columns: true,
      skip_empty_lines: true,
    });

    // 3. Transform CSV rows into your TypeScript Court[] structure
    const formattedCourts = [
      { id: 1, name: "Pista 1", slots: [] as any[] },
      { id: 2, name: "Pista 2", slots: [] as any[] },
      { id: 3, name: "Pista 3", slots: [] as any[] },
    ];

    records.forEach((row: any) => {
      const time = row['Time'];
      formattedCourts[0].slots.push({ time, status: mapStatus(row['Pista 1']) });
      formattedCourts[1].slots.push({ time, status: mapStatus(row['Pista 2']) });
      formattedCourts[2].slots.push({ time, status: mapStatus(row['Pista 3']) });
    });

    res.json(formattedCourts);
  } catch (error) {
    res.status(500).json({ error: "Error leyendo Google Sheets" });
  }
});

// Helper to convert Spanish words in Excel to your code's Status
function mapStatus(text: string): string {
  const t = text.toLowerCase().trim();
  if (t === 'ocupado' || t === 'booked') return 'booked';
  if (t === 'bloqueado' || t === 'locked') return 'locked';
  return 'available'; // Default
}

// C. Book/Lock a court (The logic you asked for)
app.post('/api/book', (req: Request, res: Response) => {
  const { courtId, time } = req.body; // Data sent from Frontend

  // 1. Find the court
  const court = courts.find(c => c.id === courtId);
  if (!court) return res.status(404).json({ message: "Pista no encontrada" });

  // 2. Find the slot within that court
  const slot = court.slots.find(s => s.time === time);
  if (!slot) return res.status(404).json({ message: "Horario no válido" });

  // 3. Check if it's actually available
  if (slot.status !== 'available') {
    return res.status(400).json({ message: "Esta pista ya no está disponible" });
  }

  // 4. LOCK the slot
  slot.status = 'locked';

  // 5. SET A TIMER (Automatic Unlock)
  // If they don't pay in 10 minutes, set it back to available
  setTimeout(() => {
    if (slot.status === 'locked') {
      slot.status = 'available';
      console.log(`Pista ${courtId} a las ${time} desbloqueada por falta de pago.`);
    }
  }, 10 * 60 * 1000); // 10 minutes in milliseconds

  res.json({ 
    success: true, 
    message: "Pista bloqueada. Tienes 10 minutos para pagar.",
    slot 
  });
});

// 5. Export for Vercel (serverless)
export default app;

// 6. Start Server (only for local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at: http://localhost:${PORT}`);
  });
}
