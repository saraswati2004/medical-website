import PageTransition from '@/components/animations/PageTransition';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { Card } from '@/components/ui/CustomCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MedicalRecord, useRecords } from '@/contexts/RecordsContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Calendar,
  Download,
  Eye,
  FilePlus2,
  FileText,
  FileUp,
  Filter,
  Search,
  Share2,
  SlidersHorizontal,
  TestTube,
  UserRound
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const RecordCard = ({ record }: { record: MedicalRecord }) => {
  const { toast } = useToast();

  const handleDownload = () => {
    if (record.file_name) {
      const url = `http://localhost:5000/uploads/${record.file_name}`; // Ensure this matches the backend path
      console.log('Download URL:', url);

      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', record.file_name || 'file'); // Ensure the download attribute is set
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

  const handleView = () => {
    if (record.file_name) {
      const url = `http://localhost:5000/uploads/${record.file_name}`; // Ensure this matches the backend path
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

  const handleShare = () => {
    if (record.owner === 'pathlab') {
      toast({
        title: "Report Shared",
        description: `Report has been shared with patient ID: ${record.patient_id}`,
      });
    } else {
      toast({
        title: "Record Shared",
        description: "Record has been shared with your healthcare provider.",
      });
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">{record.title}</h3>
            <div className="mt-1 text-sm text-gray-500">
              {record.doctor ? record.doctor : 'No doctor specified'}
              {record.provider && ` • ${record.provider}`}
            </div>
          </div>
          {record.type && (
            <span className="px-2 py-1 text-xs font-medium bg-medical-lightBlue text-medical-blue rounded-full">
              {record.type}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center text-sm text-gray-500">
          <Calendar size={14} className="mr-1.5" />
          <span>{new Date(record.date).toLocaleDateString()}</span>

          {record.owner === 'pathlab' && record.patient_id && (
            <>
              <span className="mx-1.5">•</span>
              <UserRound size={14} className="mr-1.5" />
              <span>Patient: {record.patient_id}</span>
            </>
          )}
        </div>

        {record.file_name && (
          <div className="mt-2 text-xs text-gray-500">
            File: {record.file_name} ({(record.file_size || 0) / (1024 * 1024) < 0.01 ?
              "< 0.01 MB" : ((record.file_size || 0) / (1024 * 1024)).toFixed(2) + " MB"}
            )
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-medical-blue"
                  onClick={handleView}
                >
                  <Eye size={16} className="mr-1.5" /> View
                </Button>
              </TooltipTrigger>
              <TooltipContent>View document</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-medical-blue"
                  onClick={handleDownload}
                >
                  <Download size={16} className="mr-1.5" /> Download
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download document</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-medical-blue"
                  onClick={handleShare}
                >
                  <Share2 size={16} className="mr-1.5" /> Share
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {record.owner === 'pathlab'
                  ? "Share with patient"
                  : "Share with provider"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};

const Records = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recordType, setRecordType] = useState('all');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const { getCurrentUserRecords } = useRecords();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);

    const fetchRecords = async () => {
      try {
        const userRecords = await getCurrentUserRecords();
        setRecords(userRecords);
      } catch (err) {
        console.error('Error fetching records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [getCurrentUserRecords]);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}'); // Retrieve current user from localStorage

  const filteredRecords = records.filter((record) => {
    if (userRole === 'pathlab') {
      return record.lab_id === currentUser.id; // Filter by lab_id
    } else if (userRole === 'patient') {
      return record.patient_id === currentUser.patient_id; // Filter by patient_id
    }
    return false;
  });

  console.log('Filtered Records:', filteredRecords);

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page-container min-h-screen pt-24 pb-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {userRole === 'pathlab' ? (
                  <span className="flex items-center">
                    <TestTube size={28} className="mr-2 text-medical-blue" />
                    Laboratory Records
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FileText size={28} className="mr-2 text-medical-blue" />
                    Medical Records
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">
                {userRole === 'pathlab'
                  ? 'Manage and share laboratory test reports with patients'
                  : 'Access and manage all your health records in one place'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-medical-blue hover:bg-blue-700">
                <Link to="/records/upload">
                  <FileUp size={18} className="mr-2" />
                  Upload
                </Link>
              </Button>
              <Button variant="outline" className="border-medical-blue text-medical-blue">
                <FilePlus2 size={18} className="mr-2" />
                Add Manually
              </Button>
            </div>
          </div>

          <Card className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 p-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder={userRole === 'pathlab' ? "Search lab reports..." : "Search records..."}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Select value={recordType} onValueChange={setRecordType}>
                  <SelectTrigger className="w-[180px]">
                    <Filter size={16} className="mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Laboratory">Laboratory</SelectItem>
                    <SelectItem value="Examination">Examination</SelectItem>
                    <SelectItem value="Imaging">Imaging</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Dental">Dental</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal size={18} />
                </Button>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="bg-gray-50 border w-full p-1 rounded-lg">
              <TabsTrigger className="flex-1" value="all">All Records</TabsTrigger>
              <TabsTrigger className="flex-1" value="recent">Recent</TabsTrigger>
              {userRole === 'pathlab' ? (
                <TabsTrigger className="flex-1" value="shared">Shared with Patients</TabsTrigger>
              ) : (
                <TabsTrigger className="flex-1" value="shared">Shared with Me</TabsTrigger>
              )}
              <TabsTrigger className="flex-1" value="favorites">Favorites</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
            {filteredRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecords.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
              ) : (
                <div className="text-center py-16">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No records found</h3>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records.slice(0, 3).map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            </TabsContent>

            {userRole === 'pathlab' ? (
              <TabsContent value="shared" className="mt-6">
                {records.filter(r => r.patient_id).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {records.filter(r => r.patient_id).map((record) => (
                      <RecordCard key={record.id} record={record} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Share2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No shared reports</h3>
                    <p className="text-sm text-gray-500">
                      You haven't shared any reports with patients yet
                    </p>
                  </div>
                )}
              </TabsContent>
            ) : (
              <TabsContent value="shared" className="mt-6">
                {records.filter(r => r.owner === 'pathlab').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {records.filter(r => r.owner === 'pathlab').map((record) => (
                      <RecordCard key={record.id} record={record} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Share2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No shared records</h3>
                    <p className="text-sm text-gray-500">
                      No records have been shared with you yet
                    </p>
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="favorites" className="mt-6">
              <div className="text-center py-16">
                <div className="text-center py-16">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No favorite records</h3>
                  <p className="text-sm text-gray-500">
                    Mark important records as favorites for quick access
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <Footer />
      </PageTransition>
    </>
  );
};

export default Records;