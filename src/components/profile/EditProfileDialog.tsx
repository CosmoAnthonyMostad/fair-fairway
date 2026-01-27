import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, User, Image as ImageIcon } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import type { Profile } from '@/hooks/useProfile';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onSave: (updates: Partial<Profile>) => Promise<boolean>;
  onUploadAvatar: (file: File) => Promise<string | null>;
}

// Input validation constants
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_HOME_CITY_LENGTH = 100;
const MIN_PHI = -10;
const MAX_PHI = 54;

export const EditProfileDialog = ({
  open,
  onOpenChange,
  profile,
  onSave,
  onUploadAvatar,
}: EditProfileDialogProps) => {
  const [displayName, setDisplayName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [phi, setPhi] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setHomeCity(profile.home_city || '');
      setPhi(profile.phi?.toString() || '');
      setAvatarPreview(profile.avatar_url);
      setErrors({});
    }
  }, [profile, open]);

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'displayName':
        if (value.trim().length > MAX_DISPLAY_NAME_LENGTH) {
          return `Must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`;
        }
        if (/[<>]/.test(value)) {
          return 'Contains invalid characters';
        }
        break;
      case 'homeCity':
        if (value.trim().length > MAX_HOME_CITY_LENGTH) {
          return `Must be ${MAX_HOME_CITY_LENGTH} characters or less`;
        }
        if (/[<>]/.test(value)) {
          return 'Contains invalid characters';
        }
        break;
      case 'phi':
        if (value) {
          const num = parseFloat(value);
          if (isNaN(num) || num < MIN_PHI || num > MAX_PHI) {
            return `Must be between ${MIN_PHI} and ${MAX_PHI}`;
          }
        }
        break;
    }
    return null;
  };

  const handleFieldChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    const error = validateField(field, value);
    setErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      }
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const processFile = async (file: File) => {
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    const url = await onUploadAvatar(file);
    if (url) {
      setAvatarPreview(url);
    }
    setIsUploading(false);
  };

  const handleCapacitorCamera = async (source: CameraSource) => {
    try {
      setShowPhotoOptions(false);
      
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: source,
        // iPad requires popover presentation for camera
        presentationStyle: 'popover',
        // Setting width/height helps with memory on older iPads
        width: 800,
        height: 800,
      });

      if (image.dataUrl) {
        // Convert data URL to File for upload
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        await processFile(file);
      }
    } catch (error) {
      console.error('Camera error:', error);
      // User cancelled or error - just close options
      setShowPhotoOptions(false);
    }
  };

  const handlePhotoButtonClick = () => {
    if (Capacitor.isNativePlatform()) {
      setShowPhotoOptions(true);
    } else {
      // Web fallback - just open file picker
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = async () => {
    // Validate all fields before submission
    const displayNameError = validateField('displayName', displayName);
    const homeCityError = validateField('homeCity', homeCity);
    const phiError = validateField('phi', phi);

    if (displayNameError || homeCityError || phiError) {
      setErrors({
        ...(displayNameError && { displayName: displayNameError }),
        ...(homeCityError && { homeCity: homeCityError }),
        ...(phiError && { phi: phiError }),
      });
      return;
    }

    setIsSubmitting(true);
    
    const updates: Partial<Profile> = {
      display_name: displayName.trim() || null,
      home_city: homeCity.trim() || null,
      phi: phi ? parseFloat(phi) : null,
    };

    const success = await onSave(updates);
    
    if (success) {
      onOpenChange(false);
    }
    
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-4 border-border">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <button
                type="button"
                onClick={handlePhotoButtonClick}
                disabled={isUploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
              {/* Hidden file input for web fallback */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            {/* Native photo options (Camera/Library picker) */}
            {showPhotoOptions && Capacitor.isNativePlatform() && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCapacitorCamera(CameraSource.Camera)}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCapacitorCamera(CameraSource.Photos)}
                  className="gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Choose Photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPhotoOptions(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            {isUploading && (
              <p className="text-center text-sm text-muted-foreground">Uploading...</p>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => handleFieldChange('displayName', e.target.value.slice(0, MAX_DISPLAY_NAME_LENGTH), setDisplayName)}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              placeholder="Your name"
            />
            {errors.displayName && (
              <p className="text-xs text-destructive">{errors.displayName}</p>
            )}
          </div>

          {/* Home City */}
          <div className="space-y-2">
            <Label htmlFor="homeCity">Home City</Label>
            <Input
              id="homeCity"
              value={homeCity}
              onChange={(e) => handleFieldChange('homeCity', e.target.value.slice(0, MAX_HOME_CITY_LENGTH), setHomeCity)}
              maxLength={MAX_HOME_CITY_LENGTH}
              placeholder="e.g., Seattle, WA"
            />
            {errors.homeCity && (
              <p className="text-xs text-destructive">{errors.homeCity}</p>
            )}
          </div>

          {/* PHI (Profile Handicap Index) */}
          <div className="space-y-2">
            <Label htmlFor="phi">Handicap Index (PHI)</Label>
            <Input
              id="phi"
              type="number"
              step="0.1"
              min={MIN_PHI}
              max={MAX_PHI}
              value={phi}
              onChange={(e) => handleFieldChange('phi', e.target.value, setPhi)}
              placeholder="e.g., 12.5"
            />
            {errors.phi && (
              <p className="text-xs text-destructive">{errors.phi}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Your official GHIN handicap or estimated skill level
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};