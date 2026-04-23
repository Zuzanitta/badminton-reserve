import './style.css'; // Import our CSS
import type { CourtData } from './types'; // (You need to create this file)

// Define the operating hours (10:00 to 22:00)
const START_HOUR = 10;
const END_HOUR = 22;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
let selectedDay = 'Monday'; // Default day

async function initBookingGrid(day: string = 'Monday') {
  const courtsContainer = document.querySelector<HTMLDivElement>('#court-grid');
  const labelsContainer = document.querySelector<HTMLDivElement>('#time-labels');

  if (!courtsContainer || !labelsContainer) return;

  // CLEAR BOTH CONTAINERS FIRST
  courtsContainer.innerHTML = '';
  labelsContainer.innerHTML = '';

  // 1. Fetch data from your backend with the selected day
  try {
    const response = await fetch(`https://badminton-reserve-cyan.vercel.app/api/courts?day=${day}`);
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

// Initialize day selector
function initDaySelector() {
  const daySelector = document.querySelector<HTMLDivElement>('#day-selector');
  if (!daySelector) return;

  // Calculate dates for the current week (Monday to Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to get Monday
  const monday = new Date(today.setDate(diff));

  DAYS.forEach((day, index) => {
    const button = document.createElement('button');
    
    // Calculate the date for this day
    const dayDate = new Date(monday);
    dayDate.setDate(dayDate.getDate() + index);
    
    // Format date (e.g., "Monday, April 23")
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const dateStr = dayDate.toLocaleDateString('en-US', options);
    
    // Set button text with day name and date
    button.textContent = `${day}\n${dateStr}`;
    button.className = day === selectedDay ? 'day-btn active' : 'day-btn';
    button.onclick = () => {
      selectedDay = day;
      // Update all buttons
      document.querySelectorAll('.day-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      // Reload grid for the selected day
      initBookingGrid(day);
    };
    daySelector.appendChild(button);
  });
}

// Start the whole process
initDaySelector();
initBookingGrid(selectedDay);