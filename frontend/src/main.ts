import './style.css'; // Import our CSS
import type { CourtData } from './types'; // (You need to create this file)

console.log('main.ts loaded');

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
    // Show a custom notification with a link to contact info
    showBookingNotification(courtId, time);
  } else {
    alert(`Esta pista no está disponible.`);
  }
};

// Show a booking notification with a link to contact info
function showBookingNotification(courtId: number, time: string) {
  // Create a notification element
  const notification = document.createElement('div');
  notification.className = 'booking-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <p>Has seleccionado Pista ${courtId} a las ${time}. <a href="#" class="contact-link">Contacta aquí</a> para ver la información de contacto</p>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Handle contact link click
  const contactLink = notification.querySelector('.contact-link');
  if (contactLink) {
    contactLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Close notification
      notification.remove();
      // Open contact modal
      const contactModal = document.getElementById('contact-modal');
      if (contactModal) {
        contactModal.classList.add('show');
      }
    });
  }
  
  // Handle close button
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });
  }
  
  // Auto-remove notification after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// Initialize day selector
function initDaySelector() {
  console.log('initDaySelector called');
  const daySelector = document.querySelector<HTMLDivElement>('#day-selector');
  if (!daySelector) {
    console.log('daySelector not found');
    return;
  }
  console.log('daySelector found, proceeding...');

  // Calculate dates for the current week (Monday to Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to get Monday
  const monday = new Date(today.setDate(diff));

  // Find the current weekday to keep the current day in this week
  const currentDayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentDayIndex = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;

  DAYS.forEach((day, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'day-btn';

    // Calculate the date for this day
    const dayDate = new Date(monday);
    dayDate.setDate(dayDate.getDate() + index);

    const dayIndex = index + 1; // Monday = 1, Tuesday = 2, ..., Sunday = 7
    const isDayPassed = dayIndex < currentDayIndex; // Only days before today roll to next week

    if (isDayPassed) {
      dayDate.setDate(dayDate.getDate() + 7);
    }

    button.innerText = `${day}\n${formatDate(dayDate)}`;

    if (day === selectedDay) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      document.querySelectorAll('.day-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      selectedDay = day;
      initBookingGrid(day);
    });

    daySelector.appendChild(button);
  });
}
function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  });
}
// Start the whole process
initDaySelector();
initBookingGrid(selectedDay);

// Initialize contact modal
function initContactModal() {
  const contactBtn = document.getElementById('contact-btn');
  const contactModal = document.getElementById('contact-modal');
  const closeBtn = document.getElementById('close-contact-btn');

  if (!contactBtn || !contactModal || !closeBtn) return;

  // Open modal
  contactBtn.addEventListener('click', () => {
    contactModal.classList.add('show');
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    contactModal.classList.remove('show');
  });

  // Close modal when clicking outside
  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) {
      contactModal.classList.remove('show');
    }
  });
}

// Initialize contact modal after page loads
initContactModal();