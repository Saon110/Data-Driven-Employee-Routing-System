import React, { useState } from 'react';
import { Sidebar } from '../shared/Sidebar';
import { MapPin, Calendar, Clock, Send, CheckCircle, Car, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { TimePicker } from '../ui/time-picker';
import { InteractiveMap } from '../shared/InteractiveMap';
import { useAuth } from '../../context/AuthContext';

const WEEKDAYS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
];

interface DaySchedule {
  day: string;
  location: string;
  latitude: number;
  longitude: number;
  shiftTime: string;
}

export const PickupRequestForm: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [schedules, setSchedules] = useState<DaySchedule[]>(
    WEEKDAYS.map(day => ({
      day: day.id,
      location: user?.address || '',
      latitude: user?.latitude || 40.7128,
      longitude: user?.longitude || -74.0060,
      shiftTime: '',
    }))
  );

  const currentSchedule = schedules[currentStep];

  // Mock assignment data (shown after submission)
  const assignedInfo = {
    vehiclePlate: 'ABC-1234',
    driverName: 'Sarah Wilson',
    driverPhone: '+1-555-0202',
    vehicleType: 'Van',
    seatsAvailable: '8',
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSchedules(prev => prev.map((schedule, idx) =>
      idx === currentStep
        ? { ...schedule, latitude: lat, longitude: lng }
        : schedule
    ));
  };

  const handleInputChange = (field: keyof DaySchedule, value: string) => {
    setSchedules(prev => prev.map((schedule, idx) =>
      idx === currentStep
        ? { ...schedule, [field]: value }
        : schedule
    ));
  };

  const handleNext = () => {
    if (currentStep < WEEKDAYS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const isCurrentDayValid = currentSchedule.location && currentSchedule.shiftTime;
  const allDaysValid = schedules.every(s => s.location && s.shiftTime);

  if (submitted) {
    return (
      <Sidebar role="employee">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Success Message */}
          <div className="mb-8">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-500 rounded-full p-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-green-900 mb-2">
                    Weekly Pickup Requests Submitted!
                  </h2>
                  <p className="text-green-700">
                    Your pickup requests for all 5 days have been approved and vehicles have been assigned.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Schedule Summary */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader className="border-b border-gray-100 bg-blue-50">
              <CardTitle>Weekly Schedule Summary</CardTitle>
              <CardDescription>Your pickup service schedule for each day</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {schedules.map((schedule, index) => {
                  const day = WEEKDAYS[index];
                  const pickupTime = schedule.shiftTime ? 
                    `${String(parseInt(schedule.shiftTime.split(':')[0]) - 1).padStart(2, '0')}:${schedule.shiftTime.split(':')[1]}` 
                    : '07:45';
                  
                  return (
                    <div key={day.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">{day.label}</h3>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          Pickup: {pickupTime}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Pickup Location</p>
                          <p className="text-sm font-medium text-gray-900">{schedule.location}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {schedule.latitude.toFixed(6)}, {schedule.longitude.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Shift Start Time</p>
                          <p className="text-sm font-medium text-gray-900">{schedule.shiftTime}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Vehicle Info */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader className="border-b border-gray-100 bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Car className="w-6 h-6 text-blue-600" />
                Assigned Vehicle Information
              </CardTitle>
              <CardDescription>Details about your assigned pickup service</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vehicle Plate</p>
                    <p className="font-bold text-xl text-gray-900">{assignedInfo.vehiclePlate}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Driver Information</p>
                  <p className="font-semibold text-gray-900">{assignedInfo.driverName}</p>
                  <p className="text-sm text-gray-600">{assignedInfo.driverPhone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Map for All Days */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader className="border-b border-gray-100">
              <CardTitle>All Pickup Locations</CardTitle>
              <CardDescription>Map view of all your weekly pickup locations</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <InteractiveMap
                center={[schedules[0].latitude, schedules[0].longitude]}
                markers={schedules.map((schedule, idx) => ({
                  position: [schedule.latitude, schedule.longitude] as [number, number],
                  label: `${WEEKDAYS[idx].label} - ${schedule.location}`,
                  color: '#2563EB',
                }))}
                showRoute={false}
                height="500px"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setSubmitted(false);
                setCurrentStep(0);
              }}
            >
              Submit Another Request
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors"
              onClick={() => window.location.href = '/employee/dashboard'}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar role="employee">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Weekly Pickup Service Request</h1>
          <p className="text-gray-600 mt-1">Set up your pickup location and time for each day of the week</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {WEEKDAYS.map((day, index) => (
              <div key={day.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      index === currentStep
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : index < currentStep || (schedules[index].location && schedules[index].shiftTime)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < currentStep || (schedules[index].location && schedules[index].shiftTime) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p className={`text-xs mt-2 font-medium ${index === currentStep ? 'text-blue-600' : 'text-gray-600'}`}>
                    {day.label.slice(0, 3)}
                  </p>
                </div>
                {index < WEEKDAYS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="border-b border-gray-100 bg-blue-50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              {WEEKDAYS[currentStep].label} Pickup Details
            </CardTitle>
            <CardDescription>
              Configure pickup location and shift time for {WEEKDAYS[currentStep].label}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Interactive Map */}
              <div>
                <Label className="mb-2 block">Select Pickup Location on Map</Label>
                <p className="text-sm text-gray-600 mb-3">Click anywhere on the map to set your pickup location</p>
                <InteractiveMap
                  center={[currentSchedule.latitude, currentSchedule.longitude]}
                  markers={[
                    {
                      position: [currentSchedule.latitude, currentSchedule.longitude] as [number, number],
                      label: currentSchedule.location || 'Selected Location',
                      color: '#2563EB',
                    },
                  ]}
                  onLocationSelect={handleLocationSelect}
                  height="400px"
                />
              </div>

              {/* Location Address */}
              <div className="space-y-2">
                <Label htmlFor="location">Pickup Location Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="location"
                    value={currentSchedule.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="pl-10"
                    placeholder="Enter your pickup location address"
                    required
                  />
                </div>
              </div>

              {/* Coordinates Display */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-3">Selected Coordinates</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-blue-700">Latitude</Label>
                    <Input
                      type="text"
                      value={currentSchedule.latitude.toFixed(6)}
                      readOnly
                      className="bg-white border-blue-200"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-blue-700">Longitude</Label>
                    <Input
                      type="text"
                      value={currentSchedule.longitude.toFixed(6)}
                      readOnly
                      className="bg-white border-blue-200"
                    />
                  </div>
                </div>
              </div>

              {/* Shift Start Time */}
              <TimePicker
                value={currentSchedule.shiftTime}
                onChange={(time) => handleInputChange('shiftTime', time)}
                label="Shift Start Time"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous Day
          </Button>
          
          <div className="flex-1" />

          {currentStep < WEEKDAYS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isCurrentDayValid}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Next Day
              <ArrowRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allDaysValid || isSubmitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit All Requests
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info Message */}
        {!allDaysValid && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              Please complete all {WEEKDAYS.length} days before submitting. Days completed: {schedules.filter(s => s.location && s.shiftTime).length}/{WEEKDAYS.length}
            </p>
          </div>
        )}
      </div>
    </Sidebar>
  );
};