import React, { useState } from 'react';
import { Sidebar } from '../shared/Sidebar';
import { MapPin, Calendar, Clock, Send, CheckCircle, Car, Zap, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { TimePicker } from '../ui/time-picker';
import { InteractiveMap } from '../shared/InteractiveMap';
import { useAuth } from '../../context/AuthContext';
import { mockRequests } from '../../data/mockData';

export const AdhocRequestForm: React.FC = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user has approved pickup
  const hasApprovedPickup = mockRequests.some(
    r => r.type === 'pickup' && r.status === 'approved'
  );

  const [formData, setFormData] = useState({
    location: user?.address || '',
    latitude: user?.latitude || 40.7128,
    longitude: user?.longitude || -74.0060,
    shiftTime: '',
    serviceDate: new Date().toISOString().split('T')[0],
  });

  // Mock assignment data (shown after submission)
  const assignedInfo = {
    vehiclePlate: 'XYZ-5678',
    driverName: 'Mike Johnson',
    driverPhone: '+1-555-0303',
    pickupTime: formData.shiftTime ? 
      `${String(parseInt(formData.shiftTime.split(':')[0]) - 1).padStart(2, '0')}:${formData.shiftTime.split(':')[1]}` 
      : '14:45',
    estimatedTravelTime: '20 mins',
    vehicleType: 'Mini Bus',
    seatsAvailable: '12',
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleTimeChange = (time: string) => {
    setFormData(prev => ({
      ...prev,
      shiftTime: time,
    }));
  };

  const mockRouteStop = {
    id: '1',
    order: 1,
    location: formData.location,
    latitude: formData.latitude,
    longitude: formData.longitude,
  };

  const officeStop = {
    id: '2',
    order: 2,
    location: 'Office Complex, 789 Business Park',
    latitude: 40.7489,
    longitude: -73.9680,
  };

  // If no approved pickup, show message
  if (!hasApprovedPickup) {
    return (
      <Sidebar role="employee">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Ad-hoc Service Request</h1>
            <p className="text-gray-600 mt-1">One-time pickup service for special occasions</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="bg-orange-100 rounded-full p-4 inline-flex mb-4">
                  <AlertCircle className="w-12 h-12 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Regular Pickup Service Required
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Ad-hoc service is only available for employees who have an active regular pickup service. 
                  Please submit a regular pickup request first.
                </p>
                <Button
                  className="mt-6 bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = '/employee/pickup'}
                >
                  Go to Pickup Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    );
  }

  if (submitted) {
    return (
      <Sidebar role="employee">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="mb-8">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-500 rounded-full p-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-green-900 mb-2">
                    Ad-hoc Request Submitted!
                  </h2>
                  <p className="text-green-700">
                    Your one-time ad-hoc pickup request has been approved and a vehicle has been assigned.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Vehicle Info */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader className="border-b border-gray-100 bg-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-600" />
                Ad-hoc Service Details
              </CardTitle>
              <CardDescription>One-time pickup service information</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-purple-100 rounded-lg p-3">
                      <Car className="w-6 h-6 text-purple-600" />
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

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Vehicle Details</p>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Type: {assignedInfo.vehicleType}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Capacity: {assignedInfo.seatsAvailable}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <p className="font-semibold text-purple-900">Service Date</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{formData.serviceDate}</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-blue-900">Pickup Time</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{assignedInfo.pickupTime}</p>
                    <p className="text-sm text-blue-700 mt-1">15 minutes before requested time</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <p className="font-semibold text-green-900">Estimated Travel Time</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{assignedInfo.estimatedTravelTime}</p>
                    <p className="text-sm text-green-700 mt-1">To office location</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Preview Map */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader className="border-b border-gray-100">
              <CardTitle>Route Preview</CardTitle>
              <CardDescription>Visual representation of your ad-hoc pickup route</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <InteractiveMap
                center={[formData.latitude, formData.longitude]}
                markers={[
                  {
                    position: [formData.latitude, formData.longitude] as [number, number],
                    label: formData.location || 'Pickup Location',
                    color: '#9333EA',
                  },
                  {
                    position: [officeStop.latitude, officeStop.longitude] as [number, number],
                    label: officeStop.location,
                    color: '#2563EB',
                  },
                ]}
                showRoute={true}
                height="400px"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 hover:bg-gray-100 transition-colors"
              onClick={() => setSubmitted(false)}
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
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 rounded-lg p-2">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Ad-hoc Service Request</h1>
          </div>
          <p className="text-gray-600 mt-1">Request a one-time pickup service for special occasions</p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">About Ad-hoc Service</p>
              <p className="text-sm text-blue-700 mt-1">
                This is a one-time service for days when you need pickup outside your regular schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Ad-hoc Pickup Details</CardTitle>
            <CardDescription>Fill in the details for your one-time pickup request</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Date */}
              <div className="space-y-2">
                <Label htmlFor="serviceDate">Service Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="serviceDate"
                    name="serviceDate"
                    type="date"
                    value={formData.serviceDate}
                    onChange={handleChange}
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {/* Pickup Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Pickup Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter your pickup location"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Click on map below to select location</p>
              </div>

              {/* Map Selector */}
              <div>
                <Label className="mb-2 block">Select Location on Map</Label>
                <InteractiveMap
                  center={[formData.latitude, formData.longitude]}
                  markers={[
                    {
                      position: [formData.latitude, formData.longitude] as [number, number],
                      label: formData.location || 'Pickup Location',
                      color: '#9333EA',
                    },
                    {
                      position: [officeStop.latitude, officeStop.longitude] as [number, number],
                      label: officeStop.location,
                      color: '#2563EB',
                    },
                  ]}
                  showRoute={true}
                  onLocationSelect={handleLocationSelect}
                  height="400px"
                />
              </div>

              {/* Auto-filled Coordinates */}
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 mb-3">Auto-detected Coordinates</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-purple-700">Latitude</Label>
                    <Input
                      type="text"
                      value={formData.latitude.toFixed(6)}
                      readOnly
                      className="bg-white border-purple-200"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-purple-700">Longitude</Label>
                    <Input
                      type="text"
                      value={formData.longitude.toFixed(6)}
                      readOnly
                      className="bg-white border-purple-200"
                    />
                  </div>
                </div>
              </div>

              {/* Requested Time */}
              <TimePicker
                value={formData.shiftTime}
                onChange={handleTimeChange}
                label="Requested Pickup Time"
                required
              />

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 h-12 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isSubmitting || !formData.shiftTime}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Submit Ad-hoc Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
};