import React from 'react';
import { Sidebar } from '../shared/Sidebar';
import { User as UserIcon, Mail, Phone, MapPin, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';

export const EmployeeProfile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Sidebar role="employee">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your account information</p>
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
                <CardDescription className="text-base capitalize">{user.role}</CardDescription>
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
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Home Address</p>
                      <p className="font-semibold text-gray-900">{user.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Coordinates */}
              {user.latitude && user.longitude && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Coordinates</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Latitude</p>
                        <p className="font-mono font-semibold text-gray-900">{user.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Longitude</p>
                        <p className="font-mono font-semibold text-gray-900">{user.longitude.toFixed(6)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
};
