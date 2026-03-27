import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. Setup Environment (Reads from your .env file)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware
app.use(cors());          // Allows your Frontend to talk to this Backend
app.use(express.json());  // Allows Backend to read JSON sent by Frontend

// 3. Define Types (The "Contract" for your data)
interface TimeSlot {
  time: string;       // e.g., "09:00", "10:00"
  status: 'available' | 'booked' | 'locked';
  userId?: string;    // Optional: Who booked it?
  expiresAt?: number; // Optional: For the 10-minute lock timer
}

interface Court {
  id: number;
  name: string;
  slots: TimeSlot[];  // Array of 1-hour intervals
}

// 4. Mock Data (Temporary "Database" in memory)
let courts: Court[] = [
  {
    id: 1,
    name: "Pista 1",
    slots: [
      { time: "09:00", status: "available" },
      { time: "10:00", status: "booked", userId: "user_123" },
      { time: "11:00", status: "available" }
    ]
  },
  {
    id: 2,
    name: "Pista 2",
    slots: [
      { time: "09:00", status: "locked", expiresAt: Date.now() + 600000 },
      { time: "10:00", status: "available" },
      { time: "11:00", status: "available" }
    ]
  }
];

// --- ROUTES ---

// A. Health Check
app.get('/', (req: Request, res: Response) => {
  res.send('🏸 Badminton Reserve API is running!');
});

// B. Get all courts (Frontend will call this to draw the grid)
app.get('/api/courts', (req: Request, res: Response) => {
  res.json(courts);
});

// C. Book/Lock a court (The logic you asked for)
app.post('/api/reserve', (req, res) => {
  const { courtId, timeSlot } = req.body;

  // 1. Find the court
  const court = courts.find(c => c.id === courtId);
  
  // 2. Find the specific slot in that court
  const slot = court?.slots.find(s => s.time === timeSlot);

  if (slot && slot.status === 'available') {
    slot.status = 'locked';
    slot.expiresAt = Date.now() + (10 * 60 * 1000); // 10 mins from now
    return res.json({ success: true, message: "Pista bloqueada por 10 min" });
  }

  res.status(400).json({ success: false, message: "No disponible" });
});

// 5. Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server ready at: http://localhost:${PORT}`);
});