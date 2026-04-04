import React from 'react';
import { Sidebar } from '../shared/Sidebar';
import { Users, Phone, MapPin, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { mockRouteStops } from '../../data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export const DriverPassengers: React.FC = () => {
  const allPassengers = mockRouteStops.flatMap(stop =>
    stop.passengers.map(p => ({
      ...p,
      stopLocation: stop.location,
      stopTime: stop.estimatedTime,
      stopType: stop.type,
    }))
  );

  const boardedPassengers = allPassengers.filter(p => p.isBoarded);
  const waitingPassengers = allPassengers.filter(p => !p.isBoarded);

  const PassengerCard = ({ passenger }: { passenger: typeof allPassengers[0] }) => (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {passenger.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{passenger.name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {passenger.phone}
              </p>
            </div>
          </div>
          <Badge className={passenger.isBoarded ? 'bg-green-500' : 'bg-orange-500'}>
            {passenger.isBoarded ? 'Boarded' : 'Waiting'}
          </Badge>
        </div>

        <div className="space-y-2 pt-3 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Stop Location</p>
              <p className="text-sm font-medium text-gray-900">{passenger.stopLocation}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-600">Time</p>
              <p className="text-sm font-medium text-gray-900">{passenger.stopTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={passenger.stopType === 'pickup' ? 'border-blue-300 text-blue-600' : 'border-green-300 text-green-600'}>
              {passenger.stopType}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Sidebar role="driver">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Passengers</h1>
          <p className="text-gray-600 mt-1">View and manage passenger information</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{allPassengers.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Boarded</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{boardedPassengers.length}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Waiting</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{waitingPassengers.length}</p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Passenger List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Passenger List</CardTitle>
            <CardDescription>Filter and view passengers by boarding status</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                <TabsTrigger value="all">All ({allPassengers.length})</TabsTrigger>
                <TabsTrigger value="boarded">Boarded ({boardedPassengers.length})</TabsTrigger>
                <TabsTrigger value="waiting">Waiting ({waitingPassengers.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allPassengers.map((passenger, index) => (
                    <PassengerCard key={`${passenger.id}-${index}`} passenger={passenger} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="boarded" className="space-y-4">
                {boardedPassengers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boardedPassengers.map((passenger, index) => (
                      <PassengerCard key={`${passenger.id}-${index}`} passenger={passenger} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No boarded passengers yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="waiting" className="space-y-4">
                {waitingPassengers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {waitingPassengers.map((passenger, index) => (
                      <PassengerCard key={`${passenger.id}-${index}`} passenger={passenger} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">All passengers have boarded</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
};
