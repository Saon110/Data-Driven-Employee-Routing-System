import React from 'react';
import { Sidebar } from '../shared/Sidebar';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Car, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { mockRequests } from '../../data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export const MyRequests: React.FC = () => {
  const approvedRequests = mockRequests.filter(r => r.status === 'approved');
  const pendingRequests = mockRequests.filter(r => r.status === 'pending');
  const rejectedRequests = mockRequests.filter(r => r.status === 'rejected');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'pickup' ? 'text-blue-600 bg-blue-100' : 'text-green-600 bg-green-100';
  };

  const RequestCard = ({ request }: { request: typeof mockRequests[0] }) => (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${getTypeColor(request.type)}`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 capitalize">{request.type} Service</h3>
              <p className="text-sm text-gray-600">{request.requestType === 'regular' ? 'Regular' : 'Ad-hoc'}</p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium text-gray-900">{request.location}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium text-gray-900">{request.serviceDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-medium text-gray-900">{request.shiftTime}</p>
              </div>
            </div>
          </div>

          {request.status === 'approved' && (
            <div className="pt-3 border-t border-gray-100">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 mb-2">Assigned Details</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{request.assignedVehicle}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-gray-900">{request.assignedDriver}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-gray-900">ETA: {request.estimatedTime}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Sidebar role="employee">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-600 mt-1">View and manage your transport service requests</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{mockRequests.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{approvedRequests.length}</p>
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
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{pendingRequests.length}</p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>All Requests</CardTitle>
            <CardDescription>Filter and view your service requests by status</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-4 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {mockRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mockRequests.map(request => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No requests found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4">
                {approvedRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {approvedRequests.map(request => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No approved requests</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                {pendingRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingRequests.map(request => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No pending requests</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4">
                {rejectedRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rejectedRequests.map(request => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No rejected requests</p>
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
