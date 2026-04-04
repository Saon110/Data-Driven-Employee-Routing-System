import React from 'react';
import { Sidebar } from '../shared/Sidebar';
import { User as UserIcon, Mail, Phone, Car, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { mockVehicles } from '../../data/mockData';

export const DriverProfile: React.FC = () => {
  const { user } = useAuth();
  const vehicle = mockVehicles[0]; // Assigned vehicle

  if (!user) return null;

  return (
    <Sidebar role="driver">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your driver account information</p>
        </div>

        {/* Profile Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 rounded-full w-20 h-20 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription className="text-base capitalize">{user.role} • Professional Driver</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <UserIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-green-100 rounded-lg p-2">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-semibold text-gray-900">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-orange-100 rounded-lg p-2">
                      <Phone className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-semibold text-gray-900">{user.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-purple-100 rounded-lg p-2">
                      <Car className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Driver ID</p>
                      <p className="font-semibold text-gray-900">DRV-{user.id.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4">
                <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Vehicle */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Assigned Vehicle</CardTitle>
            <CardDescription>Your currently assigned vehicle details</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100">
              <div className="bg-blue-600 rounded-2xl p-4">
                <Car className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{vehicle.plateNumber}</h3>
                <p className="text-gray-600">{vehicle.type}</p>
                <div className="flex gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="font-semibold text-gray-900">{vehicle.capacity} Seats</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vehicle ID</p>
                    <p className="font-semibold text-gray-900">{vehicle.id.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences and security</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Notification Preferences
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Download Driver Manual
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                Report an Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
};
