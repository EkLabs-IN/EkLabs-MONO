import { useState } from 'react';
import { 
  Upload, 
  Database, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  File,
  CheckCircle2,
  Loader2,
  X,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileType {
  icon: React.ElementType;
  label: string;
  color: string;
}

const FILE_TYPES: FileType[] = [
  { icon: FileText, label: 'PDF', color: 'text-red-500' },
  { icon: FileSpreadsheet, label: 'Excel', color: 'text-green-500' },
  { icon: FileSpreadsheet, label: 'CSV', color: 'text-blue-500' },
  { icon: FileText, label: 'Word', color: 'text-blue-600' },
  { icon: FileText, label: 'Text', color: 'text-gray-500' },
  { icon: FileImage, label: 'Images', color: 'text-purple-500' },
];

interface DataSourceSelectionProps {
  onComplete: () => void;
}

export function DataSourceSelection({ onComplete }: DataSourceSelectionProps) {
  const [selectedOption, setSelectedOption] = useState<'custom' | 'sample' | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleSampleData = async () => {
    try {
      setIsProcessing(true);
      console.log('Starting data source selection...');
      await onComplete();
      console.log('Data source selection completed');
    } catch (error) {
      console.error('Failed to select data source:', error);
      alert('Failed to proceed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedAfterUpload = async () => {
    try {
      setIsCompleting(true);
      await onComplete();
    } catch (error) {
      console.error('Failed to continue to dashboard:', error);
      alert('Unable to continue. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return { Icon: FileText, color: 'text-red-500' };
      case 'xlsx':
      case 'xls':
        return { Icon: FileSpreadsheet, color: 'text-green-500' };
      case 'csv':
        return { Icon: FileSpreadsheet, color: 'text-blue-500' };
      case 'docx':
      case 'doc':
        return { Icon: FileText, color: 'text-blue-600' };
      case 'txt':
        return { Icon: FileText, color: 'text-gray-500' };
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return { Icon: FileImage, color: 'text-purple-500' };
      default:
        return { Icon: File, color: 'text-gray-400' };
    }
  };

  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center bg-card">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Upload Complete!</h2>
          <p className="text-lg text-muted-foreground mb-2">
            Your files have been successfully uploaded and are being processed.
          </p>
          <p className="text-muted-foreground mb-8">
            We're training your custom knowledge assistant on your data. You'll be notified via email once your assistant is ready to use.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
            <p className="text-sm font-medium mb-2">Processing Status</p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-semibold">Training in progress...</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This usually takes 30-60 minutes depending on data volume
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={handleProceedAfterUpload} size="lg" className="w-full" disabled={isCompleting}>
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Preparing dashboard...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <ChevronRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">Prefer to explore with sample data?</p>
            <Button onClick={handleSampleData} size="lg" variant="outline" className="w-full" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue with Sample Data
                  <ChevronRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (selectedOption === 'custom') {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setSelectedOption(null)}
              className="mb-4 text-primary-foreground hover:bg-primary-foreground/10"
            >
              ← Back
            </Button>
            <h1 className="text-4xl font-bold mb-2 text-primary-foreground">Upload Your Data</h1>
            <p className="text-lg text-primary-foreground/70">
              Upload your documents to create a custom knowledge assistant
            </p>
          </div>

          <Card className="p-8 mb-6">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center transition-colors",
                uploadedFiles.length > 0
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              )}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">
                Drop files here or click to upload
              </h3>
              <p className="text-muted-foreground mb-6">
                Supports multiple file types including PDFs, Excel, CSV, Word, Text, and Images
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.txt,.jpg,.jpeg,.png,.gif"
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span>Select Files</span>
                </Button>
              </label>
            </div>

            {/* File Type Icons */}
            <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
              {FILE_TYPES.map((fileType, index) => {
                const Icon = fileType.icon;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Icon className={cn("w-5 h-5", fileType.color)} />
                    <span className="text-sm text-muted-foreground">{fileType.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {uploadedFiles.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">
                Selected Files ({uploadedFiles.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploadedFiles.map((file, index) => {
                  const { Icon, color } = getFileIcon(file.name);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                    >
                      <Icon className={cn("w-5 h-5 flex-shrink-0", color)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {isUploading && (
            <Card className="p-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Uploading files...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </Card>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleUpload}
              disabled={uploadedFiles.length === 0 || isUploading}
              size="lg"
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 w-5 h-5" />
                  Upload & Train Assistant
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-primary-foreground">Choose Your Data Source</h1>
          <p className="text-xl text-primary-foreground/70">
            Select how you'd like to get started with PharmaAI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Option 1: Upload Custom Data */}
          <Card
            className={cn(
              "p-8 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
              "border-2 hover:border-primary"
            )}
            onClick={() => setSelectedOption('custom')}
          >
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Upload Custom Data</h2>
            <p className="text-muted-foreground mb-6">
              Train your own custom knowledge assistant by uploading your proprietary documents and data files.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Supports unstructured data from multiple sources</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Custom-trained model on your data</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Get notified when your assistant is ready</span>
              </div>
            </div>

            {/* File Type Preview */}
            <div className="border-t pt-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3">SUPPORTED FORMATS</p>
              <div className="grid grid-cols-3 gap-3">
                {FILE_TYPES.map((fileType, index) => {
                  const Icon = fileType.icon;
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-accent">
                      <Icon className={cn("w-4 h-4", fileType.color)} />
                      <span className="text-xs font-medium">{fileType.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button className="w-full mt-6" size="lg">
              Upload Your Data
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Card>

          {/* Option 2: Use Sample Data */}
          <Card
            className={cn(
              "p-8 transition-all hover:shadow-lg hover:scale-[1.02]",
              "border-2 hover:border-primary"
            )}
          >
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Use Sample Data</h2>
            <p className="text-muted-foreground mb-6">
              Try out PharmaAI immediately with our pre-trained model on pharmaceutical industry sample data.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Instant access to pre-trained assistant</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Curated pharmaceutical knowledge base</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Perfect for evaluating the platform</span>
              </div>
            </div>

            {/* Sample Data Preview */}
            <div className="border-t pt-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3">INCLUDES</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>GxP Guidelines & SOPs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>FDA Regulations & Compliance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Validation Documentation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Quality Control Procedures</span>
                </div>
              </div>
            </div>

            <Button onClick={handleSampleData} className="w-full mt-6" size="lg" variant="outline" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start with Sample Data
                  <ChevronRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
