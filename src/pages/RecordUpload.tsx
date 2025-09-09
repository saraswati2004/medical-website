import PageTransition from '@/components/animations/PageTransition';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/CustomCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from '@/components/upload/FileUploader';
import { useRecords } from '@/contexts/RecordsContext';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import {
  ArrowLeft,
  Building,
  Calendar,
  FileText,
  FileUp,
  Tag,
  TestTube,
  Upload,
  User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RecordUpload = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addRecord } = useRecords();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Get the user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
        
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log('Current User:', user); // Debugging
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log('Current User:', user); // Debugging
    setCurrentUser(user);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    provider: '',
    doctor: '',
    type: '',
    category: '',
    notes: '',
    patient_id: '', // For pathlab records
  });

  // Verify patient ID when entered by lab
  const verifyPatient = async () => {
    if (!formData.patient_id) return;
    
    console.log('Patient ID being sent:', formData.patient_id);

    try {
      const response = await axios.get(`http://localhost:5000/api/patients/verify/${formData.patient_id}`);
      console.log('Patient verification response:', response.data);
      setPatientInfo(response.data);
      
      toast({
        title: "Patient Verified",
        description: `${response.data.first_name} ${response.data.last_name} found`,
        variant: "default"
      });
    } catch (error) {
      setPatientInfo(null);
      toast({
        title: "Patient Not Found",
        description: "Please check the patient ID",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (formData.patient_id && userRole === 'pathlab') {
      verifyPatient();
    }
  }, [formData.patient_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userRole === 'pathlab' && !formData.patient_id) {
      toast({
        title: "Patient ID Required",
        description: "Please enter the patient ID to link this report.",
        variant: "destructive"
      });
      return;
    }

    const patientId = userRole === 'patient' ? currentUser.patient_id : formData.patient_id;

    console.log('Final Patient ID:', patientId);

    const newRecord = {
      ...formData,
      patient_id: patientId,
      owner: userRole === 'pathlab' ? 'pathlab' : 'user',
      lab_id: userRole === 'pathlab' ? currentUser.id : undefined, // Attach lab_id for pathlab
    };

    console.log('Payload being sent:', newRecord);

    const formDataToSend = new FormData();
    Object.entries(newRecord).forEach(([key, value]) => {
      formDataToSend.append(key, value as string);
    });
    if (selectedFile) {
      formDataToSend.append('file', selectedFile);
    }

    console.log('FormData being sent:', formDataToSend); // Debugging

    try {
      await axios.post('http://localhost:5000/api/records', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: userRole === 'pathlab' ? "Lab Report Uploaded" : "Medical Record Added",
        description: "Your record has been successfully saved.",
      });

      navigate('/records');
    } catch (error) {
      console.error('Error response from backend:', error.response?.data || error.message);
      toast({
        title: "Upload Failed",
        description: "Failed to upload record. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page-container min-h-screen pt-24 pb-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center mb-6">
              <Button variant="outline" size="icon" asChild className="mr-4">
                <Link to="/records">
                  <ArrowLeft size={18} />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {userRole === 'pathlab' ? (
                    <span className="flex items-center">
                      <TestTube size={24} className="mr-2 text-medical-blue" />
                      Upload Lab Report
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FileUp size={24} className="mr-2 text-medical-blue" />
                      Upload Medical Record
                    </span>
                  )}
                </h1>
                <p className="text-gray-600 mt-1">
                  {userRole === 'pathlab' 
                    ? 'Add a new laboratory test result or patient report'
                    : 'Add a new medical document to your health records'}
                </p>
              </div>
            </div>

            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {userRole === 'pathlab' && (
                    <div>
                      <Label htmlFor="patientId" className="flex items-center text-gray-900">
                        <User size={16} className="mr-2 text-medical-blue" />
                        Patient ID <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="patientId"
                        name="patient_id"
                        placeholder="e.g., P12345"
                        value={formData.patient_id}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the patient's unique ID to link this report to their account
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="title">
                      {userRole === 'pathlab' ? 'Report Title' : 'Record Title'}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder={userRole === 'pathlab' ? "e.g., Complete Blood Count" : "e.g., Annual Physical Exam"}
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date <span className="text-red-500 ml-1">*</span></Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="type">Record Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => handleSelectChange('type', value)}
                      >
                        <SelectTrigger id="type" className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {userRole === 'pathlab' ? (
                            <>
                              <SelectItem value="Laboratory">Laboratory Test</SelectItem>
                              <SelectItem value="Blood Test">Blood Test</SelectItem>
                              <SelectItem value="Genetic Test">Genetic Test</SelectItem>
                              <SelectItem value="Microbiology">Microbiology</SelectItem>
                              <SelectItem value="Pathology">Pathology</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="Laboratory">Laboratory</SelectItem>
                              <SelectItem value="Examination">Examination</SelectItem>
                              <SelectItem value="Imaging">Imaging</SelectItem>
                              <SelectItem value="Consultation">Consultation</SelectItem>
                              <SelectItem value="Dental">Dental</SelectItem>
                              <SelectItem value="Prescription">Prescription</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="provider">
                        {userRole === 'pathlab' ? 'Laboratory Name' : 'Healthcare Provider'}
                      </Label>
                      <div className="relative mt-1">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="provider"
                          name="provider"
                          placeholder={userRole === 'pathlab' ? "e.g., City Medical Lab" : "e.g., General Hospital"}
                          value={formData.provider}
                          onChange={handleInputChange}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="doctor">
                        {userRole === 'pathlab' ? 'Pathologist/Technician' : 'Doctor'}
                      </Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="doctor"
                          name="doctor"
                          placeholder={userRole === 'pathlab' ? "e.g., Dr. Emily Rodriguez" : "e.g., Dr. Sarah Johnson"}
                          value={formData.doctor}
                          onChange={handleInputChange}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <div className="relative mt-1">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        id="category"
                        name="category"
                        placeholder={userRole === 'pathlab' ? "e.g., Hematology" : "e.g., Cardiology"}
                        value={formData.category}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Add any additional information..."
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="mt-1 resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="border border-dashed border-gray-300 rounded-lg p-6">
                    <Label className="block mb-3">Upload Document <span className="text-red-500 ml-1">*</span></Label>
                    <FileUploader 
                      onFileSelect={setSelectedFile}
                      acceptedFileTypes={['application/pdf', 'image/*']}
                      maxFileSizeMB={10}
                    />
                    
                    {selectedFile && (
                      <div className="mt-3 flex items-center text-sm text-gray-600">
                        <FileText size={16} className="mr-2" />
                        <span className="truncate">{selectedFile.name}</span>
                        <span className="ml-2">
                          ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" asChild>
                    <Link to="/records">Cancel</Link>
                  </Button>
                  <Button type="submit" className="bg-medical-blue hover:bg-blue-700">
                    <Upload size={16} className="mr-2" />
                    {userRole === 'pathlab' ? 'Upload Report' : 'Upload Record'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
        <Footer />
      </PageTransition>
    </>
  );
};

export default RecordUpload;
