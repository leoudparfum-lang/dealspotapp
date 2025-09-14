import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (uploadedUrls: string[]) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simple file upload component using native HTML5 file input
 */
export function ObjectUploader({
  maxNumberOfFiles = 4,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Validate file count
    if (files.length > maxNumberOfFiles) {
      toast({
        title: "Te veel bestanden",
        description: `Maximum ${maxNumberOfFiles} bestanden toegestaan`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate file sizes and types
    for (const file of files) {
      if (file.size > maxFileSize) {
        toast({
          title: "Bestand te groot",
          description: `${file.name} is groter dan ${Math.round(maxFileSize / 1024 / 1024)}MB`,
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Verkeerd bestandstype",
          description: `${file.name} is geen afbeelding`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        // Get upload URL
        const { url } = await onGetUploadParameters();
        
        // Upload file
        const response = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
        
        // Convert to object URL format
        const objectPath = url.split('/').slice(-1)[0].split('?')[0];
        const objectUrl = `/objects/uploads/${objectPath}`;
        uploadedUrls.push(objectUrl);
      }
      
      if (onComplete) {
        onComplete(uploadedUrls);
      }
      
      toast({
        title: "Upload succesvol",
        description: `${files.length} bestand(en) geüpload`,
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fout",
        description: "Er ging iets mis bij het uploaden",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        data-testid="input-file-upload"
      />
      
      <Button 
        onClick={() => fileInputRef.current?.click()} 
        className={buttonClassName} 
        type="button"
        disabled={isUploading}
        data-testid="button-upload-photos"
      >
        {isUploading ? "Uploaden..." : children}
      </Button>
    </div>
  );
}