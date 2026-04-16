import './style.css'; // Import our CSS
import type { CourtData } from './types'; // (You need to create this file)

// Define the operating hours (10:00 to 22:00)
const START_HOUR = 10;
const END_HOUR = 22;

async function initBookingGrid() {
  const courtsContainer = document.querySelector<HTMLDivElement>('#court-grid');
  const labelsContainer = document.querySelector<HTMLDivElement>('#time-labels');

  if (!courtsContainer || !labelsContainer) return;

  // 1. Fetch data from your backend
  try {
    const response = await fetch('https://badminton-reserve-cyan.vercel.app/api/courts');
    const courts: CourtData[] = await response.json();

    // 2. Render Time Labels (10:00, 11:00...)
    // We need an empty space for the header row corner
    labelsContainer.innerHTML = '<div class="time-label spacer"></div>';
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      labelsContainer.innerHTML += `<div class="time-label">${hour}:00</div>`;
    }

    // 3. Render Court Headers (Pista 1, Pista 2...)
    courts.slice(0, 3).forEach(court => { // Limit to 3 courts as requested
      courtsContainer.innerHTML += `<div class="cell header-cell">${court.name}</div>`;
    });

    // 4. Render the 12 Rows of Slots
    // We iterate by hour first, then by court (Row-by-Row)
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      const timeStr = `${hour}:00`;

      // For each hour, look at each of the 3 courts
      courts.slice(0, 3).forEach(court => {
        // Find the slot for this specific hour in this court
        const slot = court.slots.find(s => s.time === timeStr);

        if (slot) {
          // Add a cell with the correct status class (available, booked, locked)
          courtsContainer.innerHTML += `
            <div class="cell ${slot.status}" onclick="handleSlotClick(${court.id}, '${slot.time}', '${slot.status}')">
              ${getStatusText(slot.status)}
            </div>
          `;
        } else {
          // Handle missing data
          courtsContainer.innerHTML += `<div class="cell missing">--</div>`;
        }
      });
    }

  } catch (error) {
    console.error('Error cargando pistas:', error);
    courtsContainer.innerHTML = '<p class="error">No se pudieron cargar las pistas. ¿Está el backend encendido?</p>';
  }
}

function getStatusText(status: string): string {
  if (status === 'available') return 'Reservar';
  if (status === 'booked') return 'Ocupada';
  if (status === 'locked') return 'En pago...';
  return '';
}

// (Optional) Simple click handler to test interaction
(window as any).handleSlotClick = (courtId: number, time: string, status: string) => {
  if (status === 'available') {
    alert(`Has seleccionado Pista ${courtId} a las ${time}. ¡A por ellos!`);
    // Here you would navigate to the checkout page or call your lock API.
  } else {
    alert(`Esta pista no está disponible.`);
  }
};

// Start the whole process
initBookingGrid();