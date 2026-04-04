import React, { useState } from 'react';
import { Sidebar } from '../shared/Sidebar';
import { MapPin, Calendar, Clock, Send, CheckCircle, Car } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { TimePicker } from '../ui/time-picker';
import { InteractiveMap } from '../shared/InteractiveMap';
import { useAuth } from '../../context/AuthContext';

export const DropoffRequestForm: React.FC = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    location: user?.address || 'Office Complex, 789 Business Park',
    latitude: user?.latitude || 40.7489,
    longitude: user?.longitude || -73.9680,
    shiftEndTime: '',
    serviceDate: new Date().toISOString().split('T')[0],
  });

  // Mock assignment data (shown after submission)
  const assignedInfo = {
    vehiclePlate: 'ABC-1234',
    driverName: 'Sarah Wilson',
    driverPhone: '+1-555-0202',
    dropoffTime: '17:15',
    estimatedTravelTime: '30 mins',
    vehicleType: 'Van',
    seatsAvailable: '8',
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setIsSubmitting(false);
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const mockRouteStop = {
    id: '1',
    order: 1,
    location: formData.location,
    latitude: formData.latitude,
    longitude: formData.longitude,
  };

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
                    Dropoff Request Submitted!
                  </h2>
                  <p className="text-green-700">
                    Your dropoff request has been approved and a vehicle has been assigned.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Vehicle Info */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader className="border-b border-gray-100 bg-green-50">
              <CardTitle className="flex items-center gap-2">
                <Car className="w-6 h-6 text-green-600" />
                Assigned Vehicle Information
              </CardTitle>
              <CardDescription>Details about your assigned dropoff service</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-green-100 rounded-lg p-3">
                      <Car className="w-6 h-6 text-green-600" />
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
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-green-600" />
                      <p className="font-semibold text-green-900">Dropoff Time</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{assignedInfo.dropoffTime}</p>
                    <p className="text-sm text-green-700 mt-1">{formData.serviceDate}</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-blue-900">Estimated Travel Time</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{assignedInfo.estimatedTravelTime}</p>
                    <p className="text-sm text-blue-700 mt-1">To your destination</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Dropoff Location</p>
                    <p className="font-semibold text-gray-900">{formData.location}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Preview Map */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader className="border-b border-gray-100">
              <CardTitle>Route Preview</CardTitle>
              <CardDescription>Visual representation of your dropoff route</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <InteractiveMap
                center={[formData.latitude, formData.longitude]}
                markers={[
                  {
                    position: [formData.latitude, formData.longitude] as [number, number],
                    label: formData.location,
                    color: '#16A34A',
                  },
                ]}
                height="400px"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSubmitted(false)}
            >
              Submit Another Request
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
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
          <h1 className="text-3xl font-bold text-gray-900">Dropoff Service Request</h1>
          <p className="text-gray-600 mt-1">Request a dropoff service from your office location</p>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Dropoff Details</CardTitle>
            <CardDescription>Fill in the details for your dropoff request</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dropoff Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Dropoff Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter your dropoff location"
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
                      label: formData.location || 'Selected Location',
                      color: '#16A34A',
                    },
                  ]}
                  onLocationSelect={handleLocationSelect}
                  height="400px"
                />
              </div>

              {/* Auto-filled Coordinates */}
              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 mb-3">Auto-detected Coordinates</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-green-700">Latitude</Label>
                    <Input
                      type="text"
                      value={formData.latitude.toFixed(6)}
                      readOnly
                      className="bg-white border-green-200"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-green-700">Longitude</Label>
                    <Input
                      type="text"
                      value={formData.longitude.toFixed(6)}
                      readOnly
                      className="bg-white border-green-200"
                    />
                  </div>
                </div>
              </div>

              {/* Service Date and Shift End Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      required
                    />
                  </div>
                </div>

                <div>
                  <TimePicker
                    value={formData.shiftEndTime}
                    onChange={(time) => setFormData(prev => ({ ...prev, shiftEndTime: time }))}
                    label="Shift End Time"
                    required
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> The dropoff service will pick you up from your office location
                  and drop you at your selected destination.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 h-12 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isSubmitting || !formData.shiftEndTime}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Dropoff Request
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