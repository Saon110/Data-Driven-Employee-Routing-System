import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { InteractiveMap } from '../shared/InteractiveMap';
import { useAuth } from '../../context/AuthContext';
import { adminApi, driverApi, employeeApi, pickupRequestApi, vehicleApi } from '../../services/transportApi';
import type { Driver, Employee, PickupRequest, Vehicle } from '../../types/api';

const today = new Date().toISOString().split('T')[0];
const ROUTE_COLORS = ['#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED', '#0E7490', '#C026D3', '#65A30D'];
type AdminTab = 'employees' | 'drivers' | 'vehicles' | 'pickup-requests';

export const AdminRoutingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [serviceDate, setServiceDate] = useState(today);
  const [shiftStartTime, setShiftStartTime] = useState('22:00:00');
  const [officeLat, setOfficeLat] = useState('23.8103');
  const [officeLng, setOfficeLng] = useState('90.4125');
  const [officeBufferMinutes, setOfficeBufferMinutes] = useState('8');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('employees');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedPickupRequest, setSelectedPickupRequest] = useState<PickupRequest | null>(null);

  const [solution, setSolution] = useState<any>(null);
  const [selectedCarIdx, setSelectedCarIdx] = useState(0);

  const summary = useMemo(() => solution?.summary ?? null, [solution]);
  const selectedCar = useMemo(() => {
    if (!solution?.cars?.length) return null;
    return solution.cars[Math.min(selectedCarIdx, solution.cars.length - 1)];
  }, [solution, selectedCarIdx]);

  const selectedRouteColor = useMemo(() => ROUTE_COLORS[selectedCarIdx % ROUTE_COLORS.length], [selectedCarIdx]);

  const selectedRoutePoints = useMemo<[number, number][]>(() => {
    if (!selectedCar?.route_geometry) return [];
    return (selectedCar.route_geometry as Array<{ lat: number; lng: number }>)
      .filter((p) => p?.lat != null && p?.lng != null)
      .map((p) => [Number(p.lat), Number(p.lng)] as [number, number]);
  }, [selectedCar]);

  const selectedMarkers = useMemo(() => {
    if (!selectedCar) return [];

    const markers: Array<{
      position: [number, number];
      label: string;
      color?: string;
      badge?: string | number;
      variant?: 'office' | 'parking' | 'stop' | 'default';
    }> = [];

    if (selectedCar.parking_location?.lat != null && selectedCar.parking_location?.lng != null) {
      markers.push({
        position: [selectedCar.parking_location.lat, selectedCar.parking_location.lng],
        label: `${selectedCar.plate_no} Parking`,
        color: selectedRouteColor,
        badge: 'C',
        variant: 'parking',
      });
    }

    (selectedCar.stops ?? []).forEach((stop: any, idx: number) => {
      markers.push({
        position: [stop.pickup_location.lat, stop.pickup_location.lng],
        label: `Stop ${idx + 1}: ${stop.employee_name} (${stop.pickup_time})`,
        color: selectedRouteColor,
        badge: idx + 1,
        variant: 'stop',
      });
    });

    if (selectedCar.office_location?.lat != null && selectedCar.office_location?.lng != null) {
      markers.push({
        position: [selectedCar.office_location.lat, selectedCar.office_location.lng],
        label: 'Office',
        color: '#111111',
        badge: 'O',
        variant: 'office',
      });
    }

    return markers;
  }, [selectedCar, selectedRouteColor]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedRoutePoints.length > 0) {
      return selectedRoutePoints[0];
    }
    if (selectedMarkers.length > 0) {
      return selectedMarkers[0].position;
    }
    return [23.8103, 90.4125];
  }, [selectedMarkers, selectedRoutePoints]);

  const allRoutesMarkers = useMemo(() => {
    if (!solution?.cars?.length) {
      return [] as Array<{
        position: [number, number];
        label: string;
        color?: string;
        badge?: string | number;
        variant?: 'office' | 'parking' | 'stop' | 'default';
      }>;
    }

    const markers: Array<{
      position: [number, number];
      label: string;
      color?: string;
      badge?: string | number;
      variant?: 'office' | 'parking' | 'stop' | 'default';
    }> = [];

    solution.cars.forEach((car: any, idx: number) => {
      const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];

      if (car.parking_location?.lat != null && car.parking_location?.lng != null) {
        markers.push({
          position: [car.parking_location.lat, car.parking_location.lng],
          label: `${car.plate_no} Parking`,
          color,
          badge: 'C',
          variant: 'parking',
        });
      }

      (car.stops ?? []).forEach((stop: any) => {
        markers.push({
          position: [stop.pickup_location.lat, stop.pickup_location.lng],
          label: `${car.plate_no} Stop ${stop.order}: ${stop.employee_name}`,
          color,
          badge: stop.order,
          variant: 'stop',
        });
      });
    });

    if (solution?.office?.lat != null && solution?.office?.lng != null) {
      markers.push({
        position: [solution.office.lat, solution.office.lng],
        label: 'Office',
        color: '#111827',
        badge: 'O',
        variant: 'office',
      });
    }

    return markers;
  }, [solution]);

  const allRoutesPolylines = useMemo(() => {
    if (!solution?.cars?.length) return [] as Array<{ points: [number, number][]; color: string; weight: number; opacity: number }>;

    return solution.cars
      .map((car: any, idx: number) => {
        const points = (car.route_geometry ?? [])
          .filter((p: any) => p?.lat != null && p?.lng != null)
          .map((p: any) => [Number(p.lat), Number(p.lng)] as [number, number]);

        return {
          points,
          color: ROUTE_COLORS[idx % ROUTE_COLORS.length],
          weight: 4,
          opacity: 0.85,
        };
      })
      .filter((route: any) => route.points.length > 1);
  }, [solution]);

  const allRoutesCenter = useMemo<[number, number]>(() => {
    if (allRoutesMarkers.length > 0) return allRoutesMarkers[0].position;
    if (solution?.office?.lat != null && solution?.office?.lng != null) return [solution.office.lat, solution.office.lng];
    return [23.8103, 90.4125];
  }, [allRoutesMarkers, solution]);

  const loadAdminData = async () => {
    setError(null);
    setIsLoadingData(true);
    try {
      const fetchAllEmployees = async () => {
        const all: Employee[] = [];
        let page = 1;
        const limit = 100;

        while (true) {
          const res = await employeeApi.list({ page, limit });
          all.push(...(res.employees ?? []));
          if (page >= (res.pagination?.total_pages ?? 1)) break;
          page += 1;
        }

        return all;
      };

      const fetchAllDrivers = async () => {
        const all: Driver[] = [];
        let page = 1;
        const limit = 100;

        while (true) {
          const res = await driverApi.list({ page, limit });
          all.push(...(res.drivers ?? []));
          if (page >= (res.pagination?.total_pages ?? 1)) break;
          page += 1;
        }

        return all;
      };

      const fetchAllVehicles = async () => {
        const all: Vehicle[] = [];
        let page = 1;
        const limit = 100;

        while (true) {
          const res = await vehicleApi.list({ page, limit });
          all.push(...(res.vehicles ?? []));
          if (page >= (res.pagination?.total_pages ?? 1)) break;
          page += 1;
        }

        return all;
      };

      const fetchAllFuturePickupRequests = async () => {
        const all: PickupRequest[] = [];
        let page = 1;
        const limit = 100;

        while (true) {
          const res = await pickupRequestApi.list({ page, limit });
          all.push(...(res.pickup_requests ?? []));
          if (page >= (res.pagination?.total_pages ?? 1)) break;
          page += 1;
        }

        return all;
      };

      const [allEmployees, allDrivers, allVehicles, allPickupRequests] = await Promise.all([
        fetchAllEmployees(),
        fetchAllDrivers(),
        fetchAllVehicles(),
        fetchAllFuturePickupRequests(),
      ]);

      setEmployees(allEmployees);
      setDrivers(allDrivers);
      setVehicles(allVehicles);
      setPickupRequests(allPickupRequests);

      setSelectedEmployee(null);
      setSelectedDriver(null);
      setSelectedVehicle(null);
      setSelectedPickupRequest(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load admin data';
      setError(message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const openEmployeeDetails = async (employeeId: number) => {
    setError(null);
    try {
      const details = await employeeApi.getById(employeeId);
      setSelectedEmployee(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employee details');
    }
  };

  const openDriverDetails = async (driverId: number) => {
    setError(null);
    try {
      const details = await driverApi.getById(driverId);
      setSelectedDriver(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load driver details');
    }
  };

  const openVehicleDetails = async (vehicleId: number) => {
    setError(null);
    try {
      const details = await vehicleApi.getById(vehicleId);
      setSelectedVehicle(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicle details');
    }
  };

  const openPickupRequestDetails = async (pickupId: number) => {
    setError(null);
    try {
      const details = await pickupRequestApi.getById(pickupId);
      setSelectedPickupRequest(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pickup request details');
    }
  };

  const runRouting = async () => {
    setError(null);
    setIsRunning(true);
    try {
      const data = await adminApi.runPickupRouting({
        service_date: serviceDate,
        shift_start_time: shiftStartTime || undefined,
        office_lat: Number(officeLat),
        office_lng: Number(officeLng),
        office_buffer_minutes: Number(officeBufferMinutes),
      });
      setSolution(data);
      setSelectedCarIdx(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run routing';
      setError(message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Pickup Routing</h1>
            <p className="mt-1 text-sm text-slate-600">Run pickup scheduling and view full routing solution.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.name ?? 'Admin'}</span>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Routing Controls</CardTitle>
            <CardDescription>
              Select the next shift. Admin can browse all employees, drivers, cars, and future pickup requests, then run pickup for the next shift.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="serviceDate">Service Date</Label>
                <Input id="serviceDate" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shiftStart">Next Shift Start Time</Label>
                <Input id="shiftStart" value={shiftStartTime} onChange={(e) => setShiftStartTime(e.target.value)} placeholder="22:00:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officeLat">Office Latitude</Label>
                <Input id="officeLat" value={officeLat} onChange={(e) => setOfficeLat(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officeLng">Office Longitude</Label>
                <Input id="officeLng" value={officeLng} onChange={(e) => setOfficeLng(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officeBuffer">Office Buffer (5-10 min)</Label>
                <Input
                  id="officeBuffer"
                  type="number"
                  min={5}
                  max={10}
                  value={officeBufferMinutes}
                  onChange={(e) => setOfficeBufferMinutes(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Button onClick={loadAdminData} disabled={isLoadingData} variant="outline">
                {isLoadingData ? 'Loading...' : 'Load Admin Data'}
              </Button>
              <Button onClick={runRouting} disabled={isRunning}>
                {isRunning ? 'Running Routing...' : 'Run Pickup For Next Shift'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              Assumption for demo: employees are in same shift. Routing assigns the pending pickup requests for selected service date and shift.
            </p>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Admin Data Browser</CardTitle>
            <CardDescription>
              Click a section, then click a row to view full details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant={activeTab === 'employees' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('employees')}>
                Employees ({employees.length})
              </Button>
              <Button variant={activeTab === 'drivers' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('drivers')}>
                Drivers ({drivers.length})
              </Button>
              <Button variant={activeTab === 'vehicles' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('vehicles')}>
                Cars ({vehicles.length})
              </Button>
              <Button variant={activeTab === 'pickup-requests' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('pickup-requests')}>
                Future Pickup Requests ({pickupRequests.length})
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-md border bg-white p-3">
                {activeTab === 'employees' && (
                  <>
                    <p className="mb-2 text-sm font-semibold text-slate-800">All Employees</p>
                    <div className="max-h-72 overflow-auto rounded border">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700">
                          <tr>
                            <th className="px-2 py-2">Employee ID</th>
                            <th className="px-2 py-2">Name</th>
                            <th className="px-2 py-2">Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.length === 0 ? (
                            <tr>
                              <td className="px-2 py-3 text-slate-500" colSpan={3}>No employees found.</td>
                            </tr>
                          ) : (
                            employees.map((emp) => (
                              <tr
                                key={emp.employee_id}
                                className="cursor-pointer border-t hover:bg-slate-50"
                                onClick={() => openEmployeeDetails(emp.employee_id)}
                              >
                                <td className="px-2 py-2">{emp.employee_id}</td>
                                <td className="px-2 py-2">{emp.user?.name ?? '-'}</td>
                                <td className="px-2 py-2">{String(emp.is_active)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {activeTab === 'drivers' && (
                  <>
                    <p className="mb-2 text-sm font-semibold text-slate-800">All Drivers</p>
                    <div className="max-h-72 overflow-auto rounded border">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700">
                          <tr>
                            <th className="px-2 py-2">Driver ID</th>
                            <th className="px-2 py-2">Name</th>
                            <th className="px-2 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drivers.length === 0 ? (
                            <tr>
                              <td className="px-2 py-3 text-slate-500" colSpan={3}>No drivers found.</td>
                            </tr>
                          ) : (
                            drivers.map((driver) => (
                              <tr
                                key={driver.driver_id}
                                className="cursor-pointer border-t hover:bg-slate-50"
                                onClick={() => openDriverDetails(driver.driver_id)}
                              >
                                <td className="px-2 py-2">{driver.driver_id}</td>
                                <td className="px-2 py-2">{driver.user?.name ?? '-'}</td>
                                <td className="px-2 py-2">{(driver as any).status ?? '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {activeTab === 'vehicles' && (
                  <>
                    <p className="mb-2 text-sm font-semibold text-slate-800">All Cars / Vehicles</p>
                    <div className="max-h-72 overflow-auto rounded border">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700">
                          <tr>
                            <th className="px-2 py-2">Vehicle ID</th>
                            <th className="px-2 py-2">Plate</th>
                            <th className="px-2 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicles.length === 0 ? (
                            <tr>
                              <td className="px-2 py-3 text-slate-500" colSpan={3}>No vehicles found.</td>
                            </tr>
                          ) : (
                            vehicles.map((vehicle) => (
                              <tr
                                key={vehicle.vehicle_id}
                                className="cursor-pointer border-t hover:bg-slate-50"
                                onClick={() => openVehicleDetails(vehicle.vehicle_id)}
                              >
                                <td className="px-2 py-2">{vehicle.vehicle_id}</td>
                                <td className="px-2 py-2">{vehicle.plate_no}</td>
                                <td className="px-2 py-2">{vehicle.status}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {activeTab === 'pickup-requests' && (
                  <>
                    <p className="mb-2 text-sm font-semibold text-slate-800">Future Pickup Requests</p>
                    <div className="max-h-72 overflow-auto rounded border">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700">
                          <tr>
                            <th className="px-2 py-2">Pickup ID</th>
                            <th className="px-2 py-2">Employee</th>
                            <th className="px-2 py-2">Service Date</th>
                            <th className="px-2 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pickupRequests.length === 0 ? (
                            <tr>
                              <td className="px-2 py-3 text-slate-500" colSpan={4}>No future pickup requests found.</td>
                            </tr>
                          ) : (
                            pickupRequests.map((request) => (
                              <tr
                                key={request.pickup_id}
                                className="cursor-pointer border-t hover:bg-slate-50"
                                onClick={() => openPickupRequestDetails(request.pickup_id)}
                              >
                                <td className="px-2 py-2">{request.pickup_id}</td>
                                <td className="px-2 py-2">{request.employee?.user?.name ?? request.employee_id}</td>
                                <td className="px-2 py-2">{request.service_date}</td>
                                <td className="px-2 py-2">{request.status}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-md border bg-slate-50 p-3">
                <p className="mb-2 text-sm font-semibold text-slate-800">Details</p>

                {activeTab === 'employees' && (
                  selectedEmployee ? (
                    <div className="space-y-1 text-sm text-slate-700">
                      <p><strong>Employee ID:</strong> {selectedEmployee.employee_id}</p>
                      <p><strong>User ID:</strong> {selectedEmployee.user_id}</p>
                      <p><strong>Name:</strong> {selectedEmployee.user?.name ?? '-'}</p>
                      <p><strong>Email:</strong> {selectedEmployee.user?.email ?? '-'}</p>
                      <p><strong>Phone:</strong> {selectedEmployee.user?.phone ?? '-'}</p>
                      <p><strong>Role:</strong> {selectedEmployee.user?.role ?? '-'}</p>
                      <p><strong>Status:</strong> {selectedEmployee.user?.status ?? '-'}</p>
                      <p><strong>Home Lat:</strong> {selectedEmployee.home_lat ?? '-'}</p>
                      <p><strong>Home Lng:</strong> {selectedEmployee.home_lng ?? '-'}</p>
                      <p><strong>Active:</strong> {String(selectedEmployee.is_active)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Select an employee to see details.</p>
                  )
                )}

                {activeTab === 'drivers' && (
                  selectedDriver ? (
                    <div className="space-y-1 text-sm text-slate-700">
                      <p><strong>Driver ID:</strong> {selectedDriver.driver_id}</p>
                      <p><strong>User ID:</strong> {selectedDriver.user_id}</p>
                      <p><strong>Name:</strong> {selectedDriver.user?.name ?? '-'}</p>
                      <p><strong>Email:</strong> {selectedDriver.user?.email ?? '-'}</p>
                      <p><strong>Phone:</strong> {selectedDriver.user?.phone ?? '-'}</p>
                      <p><strong>License:</strong> {selectedDriver.license_no}</p>
                      <p><strong>Status:</strong> {(selectedDriver as any).status ?? '-'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Select a driver to see details.</p>
                  )
                )}

                {activeTab === 'vehicles' && (
                  selectedVehicle ? (
                    <div className="space-y-1 text-sm text-slate-700">
                      <p><strong>Vehicle ID:</strong> {selectedVehicle.vehicle_id}</p>
                      <p><strong>Plate:</strong> {selectedVehicle.plate_no}</p>
                      <p><strong>Capacity:</strong> {selectedVehicle.capacity}</p>
                      <p><strong>Status:</strong> {selectedVehicle.status}</p>
                      <p><strong>Parking Lat:</strong> {selectedVehicle.parking_lat ?? '-'}</p>
                      <p><strong>Parking Lng:</strong> {selectedVehicle.parking_lng ?? '-'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Select a vehicle to see details.</p>
                  )
                )}

                {activeTab === 'pickup-requests' && (
                  selectedPickupRequest ? (
                    <div className="space-y-1 text-sm text-slate-700">
                      <p><strong>Pickup ID:</strong> {selectedPickupRequest.pickup_id}</p>
                      <p><strong>Employee ID:</strong> {selectedPickupRequest.employee_id}</p>
                      <p><strong>Employee Name:</strong> {selectedPickupRequest.employee?.user?.name ?? '-'}</p>
                      <p><strong>Service Date:</strong> {selectedPickupRequest.service_date}</p>
                      <p><strong>Shift Start:</strong> {selectedPickupRequest.shift_start_time}</p>
                      <p><strong>Request Type:</strong> {selectedPickupRequest.request_type}</p>
                      <p><strong>Status:</strong> {selectedPickupRequest.status}</p>
                      <p><strong>Pickup Lat:</strong> {selectedPickupRequest.pickup_lat}</p>
                      <p><strong>Pickup Lng:</strong> {selectedPickupRequest.pickup_lng}</p>
                      <p><strong>Pickup Time:</strong> {selectedPickupRequest.pickup_time ?? '-'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Select a pickup request to see details.</p>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {solution && (
          <Card>
            <CardHeader>
              <CardTitle>Full Solution</CardTitle>
              <CardDescription>Route visualization and assignments for admin review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                  <div className="rounded-md bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">Total Requests</p>
                    <p className="text-lg font-semibold text-emerald-900">{summary.total_requests}</p>
                  </div>
                  <div className="rounded-md bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">Assigned</p>
                    <p className="text-lg font-semibold text-emerald-900">{summary.assigned_requests}</p>
                  </div>
                  <div className="rounded-md bg-sky-50 p-3">
                    <p className="text-xs text-sky-700">Cars Used</p>
                    <p className="text-lg font-semibold text-sky-900">{summary.cars_used}</p>
                  </div>
                  <div className="rounded-md bg-sky-50 p-3">
                    <p className="text-xs text-sky-700">Drivers Used</p>
                    <p className="text-lg font-semibold text-sky-900">{summary.drivers_used}</p>
                  </div>
                  <div className="rounded-md bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">Unassigned</p>
                    <p className="text-lg font-semibold text-amber-900">{summary.unassigned_requests}</p>
                  </div>
                  <div className="rounded-md bg-rose-50 p-3">
                    <p className="text-xs text-rose-700">Skipped</p>
                    <p className="text-lg font-semibold text-rose-900">{summary.skipped_requests}</p>
                  </div>
                </div>
              )}

              {solution.cars?.length > 0 ? (
                <>
                  <div className="rounded-md border bg-white p-3">
                    <p className="mb-2 text-sm font-semibold text-slate-800">All Cars and Stops (Street Routes)</p>
                    <InteractiveMap
                      center={allRoutesCenter}
                      markers={allRoutesMarkers}
                      routes={allRoutesPolylines}
                      height="520px"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {solution.cars.map((car: any, idx: number) => (
                      <Button
                        key={`${car.vehicle_id}-${idx}`}
                        variant={idx === selectedCarIdx ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCarIdx(idx)}
                      >
                        {car.plate_no} - {car.driver?.name ?? 'Driver'} ({car.assigned_employee_count})
                      </Button>
                    ))}
                  </div>

                  <div className="rounded-md border bg-white p-3">
                    <p className="mb-2 text-sm font-semibold text-slate-800">Vehicle-Driver Route Assignments</p>
                    <div className="max-h-72 overflow-auto rounded border">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700">
                          <tr>
                            <th className="px-2 py-2">Vehicle</th>
                            <th className="px-2 py-2">Driver</th>
                            <th className="px-2 py-2">Stops</th>
                            <th className="px-2 py-2">Employees</th>
                            <th className="px-2 py-2">Start</th>
                            <th className="px-2 py-2">Office ETA</th>
                            <th className="px-2 py-2">Distance (km)</th>
                            <th className="px-2 py-2">Travel (min)</th>
                            <th className="px-2 py-2">Mapping</th>
                          </tr>
                        </thead>
                        <tbody>
                          {solution.cars.map((car: any, idx: number) => (
                            <tr
                              key={`assignment-${car.vehicle_id}-${idx}`}
                              className="cursor-pointer border-t hover:bg-slate-50"
                              onClick={() => setSelectedCarIdx(idx)}
                            >
                              <td className="px-2 py-2">{car.plate_no}</td>
                              <td className="px-2 py-2">{car.driver?.name ?? '-'} ({car.driver?.driver_id ?? '-'})</td>
                              <td className="px-2 py-2">{(car.stops ?? []).length}</td>
                              <td className="px-2 py-2">{car.assigned_employee_count ?? 0}</td>
                              <td className="px-2 py-2">{car.route_start_time ?? '-'}</td>
                              <td className="px-2 py-2">{car.office_arrival_time ?? '-'}</td>
                              <td className="px-2 py-2">{car.route_distance_km ?? '-'}</td>
                              <td className="px-2 py-2">{car.route_travel_time_min ?? '-'}</td>
                              <td className="px-2 py-2">{car.driver_assignment_source ?? 'mapped'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-md border bg-white p-2">
                    <InteractiveMap
                      center={mapCenter}
                      markers={selectedMarkers}
                      showRoute={true}
                      routeColor={selectedRouteColor}
                      routes={selectedRoutePoints.length > 1 ? [{ points: selectedRoutePoints, color: selectedRouteColor, weight: 5, opacity: 0.9 }] : []}
                      height="540px"
                    />
                  </div>

                  {selectedCar && (
                    <div className="rounded-md border bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-800">
                        {selectedCar.plate_no} | Driver: {selectedCar.driver?.name} | Start: {selectedCar.route_start_time} | Office ETA: {selectedCar.office_arrival_time}
                      </p>
                      <div className="mt-3 max-h-56 overflow-auto rounded bg-white p-3 text-sm">
                        {(selectedCar.stops ?? []).map((stop: any) => (
                          <p key={`${stop.pickup_id}-${stop.order}`} className="py-1 text-slate-700">
                            Stop {stop.order}: {stop.employee_name} ({stop.employee_id}) | Pickup {stop.pickup_time}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No car routes generated for this run.
                </div>
              )}

              <details className="rounded-md border bg-white p-3">
                <summary className="cursor-pointer text-sm font-medium text-slate-800">Raw JSON (optional)</summary>
                <pre className="mt-3 max-h-[400px] overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
                  {JSON.stringify(solution, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
