# Transport Route Management System

A modern web-based Transport Route Management System with separate interfaces for Employees and Drivers.

## Demo Accounts

### Employee Account
- **Email:** john.doe@company.com
- **Password:** demo123
- **Role:** Employee

### Driver Account
- **Email:** sarah.wilson@company.com
- **Password:** demo123
- **Role:** Driver

## Features

### Employee Portal
- **Dashboard** with request status overview and route visualization
- **Pickup Service** - Request weekly pickup service (select up to 5 days)
  - Choose multiple days of the week (Monday-Friday)
  - Set custom shift start time
  - Auto-detected GPS coordinates
  - Route preview with dummy map visualization
- **Dropoff Service** - Request dropoff service back home
  - Custom dropoff time
  - Route preview
- **Ad-hoc Service** ⚡ NEW
  - One-time pickup service for special occasions
  - Only available after approved regular pickup request
  - Same options as pickup service
- **My Requests** - View all requests with filtering by status (Pending/Approved/Rejected)
- **Profile Management**

### Driver Portal
- **Today's Route** with interactive features:
  - Full route map with numbered stops
  - Passenger boarding toggle switches
  - Route status control (Not Started / In Progress / Completed)
  - **Route Planning Timeline** with:
    - Total distance (12.5 km)
    - Estimated duration (45 mins)
    - Average time per stop
    - Step-by-step route breakdown with distances
- **Passenger Management**
  - View all passengers with boarding status
  - Filter by: All, Boarded, Waiting
- **Vehicle Information**
  - Assigned vehicle details
  - Route assignment overview
  - Complete stop list
- **Profile Management**

## New Features (Latest Update)

✅ **Ad-hoc Service** - Conditional service available only with approved pickup  
✅ **Weekly Scheduling** - Select multiple days (1-5) for regular pickup service  
✅ **Custom Time Input** - Manually enter shift start/end times  
✅ **Enhanced Buttons** - All buttons have loading states and hover effects  
✅ **Route Planning** - Detailed timeline view for drivers with distances and durations  
✅ **Better Map Visualization** - Dummy routes displayed on all map previews  

## Design System

- **Primary Color:** Blue #2563EB
- **Theme:** Light, clean enterprise SaaS style
- **Components:** Rounded cards with soft shadows
- **Typography:** System fonts with clean hierarchy
- **Layout:** Professional dashboard with sidebar navigation
- **Interactions:** Responsive buttons with loading states and smooth transitions
- **Responsive:** Mobile-friendly design

## Quick Start

1. Click "Quick Demo Login" buttons on the login page
2. Or manually enter credentials from above
3. Select appropriate role (Employee/Driver)
4. Explore the dashboard and features

### Testing Flow

**Employee:**
1. Login as employee
2. Submit a pickup request (select days + time)
3. Ad-hoc service menu will appear ⚡
4. Submit ad-hoc or dropoff requests
5. View all requests in "My Requests"

**Driver:**
1. Login as driver
2. View today's route with detailed planning
3. Toggle passenger boarding status
4. Mark route as started/completed
5. View detailed statistics and timeline

## Technologies

- React 18
- TypeScript
- Tailwind CSS v4
- React Router v7
- Radix UI Components
- Lucide Icons
- Modern animations and transitions
