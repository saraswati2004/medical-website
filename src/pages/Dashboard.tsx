import PageTransition from '@/components/animations/PageTransition';
import StatsCard from '@/components/dashboard/StatsCard';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/CustomCard';
import { MedicalRecord, useRecords } from '@/contexts/RecordsContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, BarChart, Calendar, Clock, Download, Eye, FilePlus2, FileText, Plus, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Mock Data for Dashboard
const upcomingAppointments = [
  { id: 1, title: 'Dental Checkup', date: '2024-01-15', time: '10:00 AM', doctor: 'Dr. James Wilson' },
  { id: 2, title: 'Eye Examination', date: '2024-01-28', time: '2:30 PM', doctor: 'Dr. Patricia Miller' },
];

const Dashboard = () => {
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { getCurrentUserRecords } = useRecords();
  const { getPatientRecords } = useRecords();
  const [patientRecords, setPatientRecords] = useState([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role); // Ensure userRole is set correctly
    const fetchRecords = async () => {
      try {
        const userRecords = await getCurrentUserRecords();
        setRecords(userRecords);
      } catch (err) {
        console.error('Error fetching records:', err);
        toast({
          title: "Error",
          description: "Failed to load records",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecords();
  }, [getCurrentUserRecords]);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}'); // Fetch current user from localStorage

  const filteredRecords = records.filter((record) => {
    if (userRole === 'pathlab') {
      return record.lab_id === currentUser.id; // Filter by lab_id
    } else if (userRole === 'patient') {
      return record.patient_id === currentUser.patient_id; // Filter by patient_id
    }
    return false;
  });

  console.log('Filtered Records:', filteredRecords);

  const recentRecords = filteredRecords.slice(0, 3);
  
  // File handling functions
  const handleViewFile = (record: MedicalRecord) => {
    if (record.file_name) {
      const url = `http://localhost:5000/uploads/${record.file_name}`;
      console.log('View URL:', url);
      window.open(url, '_blank');
    } else {
      toast({
        title: "View Failed",
        description: "No file data available to view.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadFile = (record: MedicalRecord) => {
    if (record.file_name) {
      const url = `http://localhost:5000/uploads/${record.file_name}`;
      console.log('Download URL:', url);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.file_name || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: "File Downloaded",
        description: "Your file has been downloaded successfully.",
      });
    } else {
      toast({
        title: "Download Failed",
        description: "No file data available for download.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page-container min-h-screen pt-24 pb-16">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
            {userRole === 'pathlab' ? 'Laboratory Dashboard' : 'Patient Dashboard'}
            </h1>
            <p className="text-gray-600 mt-2">
              {userRole === 'pathlab' 
                ? 'Manage and upload patient reports' 
                : 'Welcome back! Here\'s an overview of your health records.'}
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Records"
              value={filteredRecords.length.toString()}
              icon={<FileText size={24} className="text-medical-blue" />}
              trend="up"
              trendValue={`${filteredRecords.length > 0 ? filteredRecords.length - 3 : 0} new this month`}            />
            
            {userRole === 'pathlab' ? (
              <StatsCard
                title="Tests Conducted"
                value={(filteredRecords.filter(r => r.type === 'Laboratory').length).toString()}                icon={<Activity size={24} className="text-medical-blue" />}
                description="Laboratory tests"
              />
            ) : (
              <StatsCard
                title="Last Checkup"
                value={filteredRecords.length > 0 ? new Date(filteredRecords[0].date).toLocaleDateString() : "None"}
                icon={<Calendar size={24} className="text-medical-blue" />}
                description={filteredRecords.length > 0 ? filteredRecords[0].title : "No records yet"}
              />
            )}
            
            {userRole === 'pathlab' ? (
              <StatsCard
                title="Reports Shared"
                value={Math.floor(filteredRecords.filter(r => r.patient_id).length).toString()}
                icon={<FileText size={24} className="text-medical-blue" />}
                description="With patients"
              />
            ) : (
              <StatsCard
                title="Health Score"
                value="92/100"
                icon={<Activity size={24} className="text-medical-blue" />}
                trend="up"
                trendValue="+5 from last visit"
              />
            )}
            
            <StatsCard
              title="Upcoming"
              value={upcomingAppointments.length.toString()}
              icon={<Clock size={24} className="text-medical-blue" />}
              description={userRole === 'pathlab' ? "Patient appointments" : "Scheduled appointments"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Medical Records */}
            <div className="lg:col-span-2">
              <Card className="h-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {userRole === 'pathlab' ? 'Recent Lab Reports' : 'Recent Medical Records'}
                  </h2>
                  <Button asChild variant="ghost" size="sm" className="text-medical-blue">
                    <Link to="/records">
                      View All <ArrowUpRight size={16} className="ml-1" />
                    </Link>
                  </Button>
                </div>
                
                {recentRecords.length > 0 ? (
                  <div className="space-y-4">
                    {recentRecords.map((record) => (
                      <motion.div
                        key={record.id}
                        whileHover={{ x: 3 }}
                        className="p-4 border border-gray-100 rounded-lg hover:bg-blue-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{record.title}</h3>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <span>{record.doctor || 'No doctor specified'}</span>
                              {record.provider && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{record.provider}</span>
                                </>
                              )}
                              <span className="mx-2">•</span>
                              <span>{new Date(record.date).toLocaleDateString()}</span>
                              
                              {record.owner === 'pathlab' && record.patient_id && (
                                <>
                                  <span className="mx-2">•</span>
                                  <UserRound size={14} className="mr-1" />
                                  <span>Patient: {record.patient_id}</span>
                                </>
                              )}
                            </div>
                            
                            {record.file_name && (
                              <div className="mt-2 text-xs text-gray-500">
                                File: {record.file_name}
                              </div>
                            )}
                          </div>
                          
                          {record.type && (
                            <span className="px-2 py-1 text-xs font-medium bg-medical-lightBlue text-medical-blue rounded-full">
                              {record.type}
                            </span>
                          )}
                        </div>
                        
                        {record.fileData && (
                          <div className="mt-3 flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-medical-blue"
                              onClick={() => handleViewFile(record)}
                            >
                              <Eye size={14} className="mr-1" /> View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-medical-blue"
                              onClick={() => handleDownloadFile(record)}
                            >
                              <Download size={14} className="mr-1" /> Download
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No records yet</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {userRole === 'pathlab' 
                        ? 'Upload your first lab report to get started'
                        : 'Upload your first medical record to get started'}
                    </p>
                  </div>
                )}
                
                <div className="mt-6">
                  <Button asChild className="w-full bg-medical-blue hover:bg-blue-700">
                    <Link to="/records/upload">
                      <FilePlus2 size={18} className="mr-2" />
                      {userRole === 'pathlab' ? 'Upload Lab Report' : 'Upload Medical Record'}
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
            
            {/* Right side card - different for each role */}
            <div>
              <Card className="h-full p-6">
                {userRole === 'pathlab' ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Patient Activity</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <motion.div
                        whileHover={{ x: 3 }}
                        className="p-4 border border-gray-100 rounded-lg hover:bg-blue-50/50 transition-colors"
                      >
                        <h3 className="font-medium text-gray-900">Reports linked to Patient ID</h3>
                        <div className="mt-3">
                          {filteredRecords.filter(r => r.patient_id).length > 0 ? (
                            <div className="space-y-2">
                              {Array.from(new Set(filteredRecords.filter(r => r.patient_id).map(r => r.patient_id))).map((patientId, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <UserRound size={16} className="mr-2 text-medical-blue" />
                                    <span>Patient ID: {patientId}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                  {filteredRecords.filter(r => r.patient_id === patientId).length} reports
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No patients linked yet</p>
                          )}
                        </div>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ x: 3 }}
                        className="p-4 border border-gray-100 rounded-lg hover:bg-blue-50/50 transition-colors"
                      >
                        <h3 className="font-medium text-gray-900">Recent Activity</h3>
                        <div className="mt-2 text-sm text-gray-500">
                          <div className="mt-1">
                            <span>2 hours ago:</span> Sarah Johnson viewed her lab results
                          </div>
                          <div className="mt-1">
                            <span>Yesterday:</span> Michael Smith downloaded his report
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
                      <Button variant="ghost" size="sm" className="text-medical-blue">
                        <Calendar size={16} className="mr-1" /> Add
                      </Button>
                    </div>
                    
                    {upcomingAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingAppointments.map((appointment) => (
                          <motion.div
                            key={appointment.id}
                            whileHover={{ x: 3 }}
                            className="p-4 border border-gray-100 rounded-lg hover:bg-blue-50/50 transition-colors"
                          >
                            <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <Calendar size={14} className="mr-1.5" />
                              <span>{new Date(appointment.date).toLocaleDateString()}</span>
                              <span className="mx-1">•</span>
                              <Clock size={14} className="mr-1.5" />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {appointment.doctor}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No upcoming appointments</h3>
                        <p className="text-sm text-gray-500 mt-1">Schedule your next appointment</p>
                        <Button className="mt-4 bg-medical-blue hover:bg-blue-700">
                          <Plus size={16} className="mr-1" /> Add Appointment
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          </div>
          
          {/* Health Insights / Admin Panel based on role */}
          <div className="mt-8">
            <Card className="h-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {userRole === 'pathlab' ? 'Lab Analytics' : 'Health Insights'}
                </h2>
                <Button variant="outline" size="sm" className="text-medical-blue border-medical-blue">
                  <BarChart size={16} className="mr-1.5" /> View Trends
                </Button>
              </div>
              
              <div className="text-center py-12">
                <div className="inline-flex justify-center items-center p-4 rounded-full bg-medical-lightBlue/50 mb-4">
                  <Activity size={32} className="text-medical-blue" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {userRole === 'pathlab' ? 'Lab Analytics Coming Soon' : 'Health Insights Coming Soon'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {userRole === 'pathlab' 
                    ? 'We\'re working on analytics to help you track lab performance and patient outcomes.'
                    : 'We\'re working on analyzing your health data to provide personalized insights and recommendations.'}
                </p>
              </div>
            </Card>
          </div>
        </div>
        <Footer />
      </PageTransition>
    </>
  );
};

export default Dashboard;
