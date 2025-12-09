import { memo, useState } from "react";
import { ArrowLeft, User, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Profile {
  name: string;
  email: string;
  role: string;
  clearance: string;
  initials: string;
}

const defaultProfile: Profile = {
  name: "Cmdr. Shepard",
  email: "shepard@cohetebrands.com",
  role: "Director de Marketing",
  clearance: "Level 5",
  initials: "CM",
};

const ProfilePage = memo(function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem("cohete-brands-profile");
    if (saved) {
      try {
        return { ...defaultProfile, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    }
    return defaultProfile;
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    localStorage.setItem("cohete-brands-profile", JSON.stringify(profile));
    setHasChanges(false);
    toast({
      title: "Profile Saved",
      description: "Your personal information has been updated successfully",
    });
  };

  const updateProfile = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-sm" data-testid="button-back">
                  <ArrowLeft className="size-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-wide">USER PROFILE</h1>
                <p className="text-sm text-zinc-500 font-mono uppercase tracking-wider">
                  Personal information and security
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
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
          <Card className="border-zinc-800 bg-zinc-900 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50" />
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-primary/10 border border-primary/20">
                  <User className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display uppercase tracking-tight">Personal Information</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Your platform credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-20 border-2 border-primary/20">
                  <AvatarFallback className="bg-zinc-800 text-2xl font-display font-bold text-zinc-400">
                    {profile.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="initials" className="text-xs font-mono uppercase text-zinc-400">Avatar Initials</Label>
                  <Input
                    id="initials"
                    value={profile.initials}
                    onChange={(e) => updateProfile("initials", e.target.value.toUpperCase().slice(0, 2))}
                    className="rounded-sm border-zinc-800 bg-zinc-950 mt-1 max-w-[100px]"
                    maxLength={2}
                    data-testid="input-initials"
                  />
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-mono uppercase text-zinc-400">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => updateProfile("name", e.target.value)}
                    className="rounded-sm border-zinc-800 bg-zinc-950"
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-mono uppercase text-zinc-400">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfile("email", e.target.value)}
                    className="rounded-sm border-zinc-800 bg-zinc-950"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-mono uppercase text-zinc-400">Role / Position</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    onChange={(e) => updateProfile("role", e.target.value)}
                    className="rounded-sm border-zinc-800 bg-zinc-950"
                    data-testid="input-role"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clearance" className="text-xs font-mono uppercase text-zinc-400">Clearance Level</Label>
                  <Select
                    value={profile.clearance}
                    onValueChange={(value) => updateProfile("clearance", value)}
                  >
                    <SelectTrigger className="rounded-sm border-zinc-800 bg-zinc-950" data-testid="select-clearance">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Level 1">Level 1 - Basic</SelectItem>
                      <SelectItem value="Level 2">Level 2 - Standard</SelectItem>
                      <SelectItem value="Level 3">Level 3 - Advanced</SelectItem>
                      <SelectItem value="Level 4">Level 4 - Classified</SelectItem>
                      <SelectItem value="Level 5">Level 5 - Top Secret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-zinc-800 bg-zinc-900 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-50" />
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-red-500/10 border border-red-500/20">
                  <Lock className="size-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display uppercase tracking-tight">Security</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Authentication and password management
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-sm bg-zinc-950/50 border border-zinc-800">
                <p className="text-sm text-zinc-500 mb-3">
                  Authentication system is not yet configured. Password management will be available once user authentication is implemented.
                </p>
                <Button
                  variant="outline"
                  className="rounded-sm w-full border-zinc-800 hover:bg-zinc-800"
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
    </div>
  );
});

export default ProfilePage;
