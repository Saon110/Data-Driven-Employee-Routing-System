import React from 'react';
import { Sidebar } from '../shared/Sidebar';
import {
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { MapPlaceholder } from '../shared/MapPlaceholder';
import { mockRequests, mockRouteStops } from '../../data/mockData';
import { useNavigate } from 'react-router';

export const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const approvedRequests = mockRequests.filter(r => r.status === 'approved');
  const pendingCount = mockRequests.filter(r => r.status === 'pending').length;
  const approvedCount = approvedRequests.length;
  const rejectedCount = mockRequests.filter(r => r.status === 'rejected').length;

  const upcomingPickup = approvedRequests.find(r => r.type === 'pickup');
  const upcomingDropoff = approvedRequests.find(r => r.type === 'dropoff');

  return (
    <Sidebar role="employee">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your transport overview</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{pendingCount}</p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Awaiting approval
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved Requests</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{approvedCount}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                Ready to go
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected Requests</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{rejectedCount}</p>
                </div>
                <div className="bg-red-100 rounded-full p-3">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <XCircle className="w-4 h-4 mr-1" />
                Not approved
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer" onClick={() => navigate('/employee/pickup')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Pickup Service</h3>
                  <p className="text-sm text-gray-600">Book a ride to the office</p>
                </div>
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer" onClick={() => navigate('/employee/dropoff')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Dropoff Service</h3>
                  <p className="text-sm text-gray-600">Book a ride back home</p>
                </div>
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Upcoming Pickup */}
          {upcomingPickup && (
            <Card className="border-0 shadow-md">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Upcoming Pickup
                </CardTitle>
                <CardDescription>Your next scheduled pickup service</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="font-semibold text-gray-900">
                        {upcomingPickup.serviceDate} at {upcomingPickup.shiftTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-lg p-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pickup Location</p>
                      <p className="font-semibold text-gray-900">{upcomingPickup.location}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-sm font-medium text-blue-900 mb-2">Assigned Vehicle</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{upcomingPickup.assignedVehicle}</p>
                        <p className="text-sm text-gray-600">Driver: {upcomingPickup.assignedDriver}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">ETA</p>
                        <p className="font-semibold text-blue-600">{upcomingPickup.estimatedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Dropoff */}
          {upcomingDropoff && (
            <Card className="border-0 shadow-md">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Upcoming Dropoff
                </CardTitle>
                <CardDescription>Your next scheduled dropoff service</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="font-semibold text-gray-900">
                        {upcomingDropoff.serviceDate} at {upcomingDropoff.shiftTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 rounded-lg p-2">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dropoff Location</p>
                      <p className="font-semibold text-gray-900">{upcomingDropoff.location}</p>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-sm font-medium text-green-900 mb-2">Assigned Vehicle</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{upcomingDropoff.assignedVehicle}</p>
                        <p className="text-sm text-gray-600">Driver: {upcomingDropoff.assignedDriver}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">ETA</p>
                        <p className="font-semibold text-green-600">{upcomingDropoff.estimatedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Route Map */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Assigned Route Overview</CardTitle>
            <CardDescription>Visual representation of your scheduled routes</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <MapPlaceholder stops={mockRouteStops} height="500px" />
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
};
