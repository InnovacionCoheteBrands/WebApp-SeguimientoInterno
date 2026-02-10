import { memo, useState, useRef, ChangeEvent } from "react";
import { ArrowLeft, User, Lock, Save, Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface Profile {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string; // Add avatarUrl
  // These fields are not in the DB schema yet, but were in the mock. 
  // We'll keep them optional or read-only/mocked where data is missing.
  clearance?: string;
  initials?: string;
  name?: string;
}

// Canvas utility for cropping
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const ProfilePage = memo(function ProfilePage() {
  const { toast } = useToast();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // -- Data Fetching --
  const { data: user, isLoading } = useQuery<Profile>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!token
  });

  // -- Avatar Upload State --
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Mutation --
  const uploadAvatarMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');

      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // Don't set Content-Type for FormData
        body: formData
      });

      if (!res.ok) throw new Error('Failed to upload avatar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setIsCropDialogOpen(false);
      setImgSrc('');
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    }
  });

  // -- Handlers --

  const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Limit file size (e.g. 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setCrop(undefined); // Reset crop
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      );
      reader.readAsDataURL(file);
      setIsCropDialogOpen(true);
    }
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1)); // 1:1 aspect ratio
  }

  const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0, 0,
      crop.width,
      crop.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.9); // Quality 0.9
    });
  }

  const handleUpload = async () => {
    if (completedCrop && imgRef.current) {
      try {
        const blob = await getCroppedImg(imgRef.current, completedCrop);
        uploadAvatarMutation.mutate(blob);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // Placeholder save handler (frontend only for other fields for now as per requirement focus on avatar)
  // Real implementation would handle PATCH /api/users/:id
  const handleSave = () => {
    toast({
      title: "Not Implemented",
      description: "Profile updates other than avatar are pending implementation.",
    });
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;

  const userInitials = user?.username?.slice(0, 2).toUpperCase() || "??";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-back">
                  <ArrowLeft className="size-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-wide">USER PROFILE</h1>
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                  Personal information and security
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={true} // Disabled as we only focused on avatar
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-save-profile"
            >
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Profile Information */}
          <Card className="border-border bg-card shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50" />
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 border border-primary/20">
                  <User className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display uppercase tracking-tight">Personal Information</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                    Your platform credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="size-24 border-2 border-primary/20 cursor-pointer transition-opacity group-hover:opacity-80" onClick={() => fileInputRef.current?.click()}>
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-muted text-2xl font-display font-bold text-muted-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                    <Camera className="size-6 text-foreground bg-background/50 rounded-full p-1" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={onSelectFile}
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold">{user?.username}</h3>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="size-4 mr-2" />
                    Change Avatar
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-mono uppercase text-muted-foreground">Username</Label>
                  <Input
                    id="username"
                    value={user?.username || ''}
                    disabled
                    className="rounded-xl border-border bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-mono uppercase text-muted-foreground">Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="rounded-xl border-border bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-mono uppercase text-muted-foreground">Role / Position</Label>
                  <Input
                    id="role"
                    value={user?.role || ''}
                    disabled
                    className="rounded-xl border-border bg-muted/50"
                  />
                </div>

                {/* Placeholder for fields technically not in DB User model yet but required by UI design */}
                <div className="space-y-2">
                  <Label htmlFor="clearance" className="text-xs font-mono uppercase text-muted-foreground">Clearance Level</Label>
                  <Input value="Level 5" disabled className="rounded-xl border-border bg-muted/50" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-border bg-card shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-50" />
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20">
                  <Lock className="size-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display uppercase tracking-tight">Security</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                    Authentication and password management
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-background/50 border border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Password management is available via the admin portal or by contacting support.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full w-full border-border hover:bg-muted"
                  disabled
                  data-testid="button-change-password"
                >
                  <Lock className="size-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Crop Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
            <DialogDescription>
              Adjust the cropping area to frame your profile picture.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} style={{ maxHeight: '400px' }} />
              </ReactCrop>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCropDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!completedCrop || uploadAvatarMutation.isPending}>
              {uploadAvatarMutation.isPending ? "Uploading..." : "Save Avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
});

export default ProfilePage;
