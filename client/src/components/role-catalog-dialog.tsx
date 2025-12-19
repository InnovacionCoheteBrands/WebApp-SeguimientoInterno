import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Edit2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchAgencyRoles, createAgencyRole, updateAgencyRole, deleteAgencyRole } from "@/lib/api";
import { AgencyRole, InsertAgencyRole } from "@shared/schema";

interface RoleCatalogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RoleCatalogDialog({ open, onOpenChange }: RoleCatalogDialogProps) {
    const { toast } = useToast();
    const [roles, setRoles] = useState<AgencyRole[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [editingRole, setEditingRole] = useState<AgencyRole | null>(null);
    const [formData, setFormData] = useState<Partial<InsertAgencyRole>>({
        roleName: "",
        department: "",
        defaultBillableRate: "0",
        allowedActivities: "[]"
    });
    const [currentActivities, setCurrentActivities] = useState<string[]>([]);
    const [newActivity, setNewActivity] = useState("");

    useEffect(() => {
        if (open) {
            loadRoles();
        }
    }, [open]);

    const loadRoles = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAgencyRoles();
            setRoles(data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load roles", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setEditingRole(null);
        setFormData({ roleName: "", department: "", defaultBillableRate: "0", allowedActivities: "[]" });
        setCurrentActivities([]);
        setNewActivity("");
    };

    const handleEdit = (role: AgencyRole) => {
        setEditingRole(role);
        const activities = role.allowedActivities ? JSON.parse(role.allowedActivities as string) : [];
        setFormData({
            roleName: role.roleName,
            department: role.department,
            defaultBillableRate: role.defaultBillableRate,
            allowedActivities: role.allowedActivities
        });
        setCurrentActivities(activities);
    };

    const handleAddActivity = () => {
        if (!newActivity.trim()) return;
        if (!currentActivities.includes(newActivity.trim())) {
            const updated = [...currentActivities, newActivity.trim()];
            setCurrentActivities(updated);
            setFormData({ ...formData, allowedActivities: JSON.stringify(updated) });
        }
        setNewActivity("");
    };

    const removeActivity = (activity: string) => {
        const updated = currentActivities.filter(a => a !== activity);
        setCurrentActivities(updated);
        setFormData({ ...formData, allowedActivities: JSON.stringify(updated) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.roleName || !formData.department) {
            toast({ title: "Validation Error", description: "Role Name and Department are required", variant: "destructive" });
            return;
        }

        try {
            if (editingRole) {
                await updateAgencyRole(editingRole.id, formData);
                toast({ title: "Success", description: "Role updated" });
            } else {
                await createAgencyRole(formData as InsertAgencyRole);
                toast({ title: "Success", description: "Role created" });
            }
            resetForm();
            loadRoles();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save role", variant: "destructive" });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This might affect team members linked to this role.")) return;
        try {
            await deleteAgencyRole(id);
            toast({ title: "Success", description: "Role deleted" });
            loadRoles();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete role", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-[800px] border-border bg-card text-foreground rounded-sm h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b border-border">
                    <DialogTitle>Master Service Catalog</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Define standard roles, base rates, and allowed activities for your agency.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* List Section */}
                    <div className="w-1/3 border-r border-border overflow-y-auto p-4 space-y-2 bg-muted/30">
                        <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase mb-3">Defined Roles</h3>
                        {isLoading ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : (
                            roles.map(role => (
                                <div
                                    key={role.id}
                                    className={`p-3 rounded-sm border cursor-pointer hover:bg-muted transition-colors ${editingRole?.id === role.id ? 'bg-muted border-primary/50' : 'bg-background border-border'}`}
                                    onClick={() => handleEdit(role)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-sm text-foreground">{role.roleName}</span>
                                        <Badge variant="outline" className="text-[10px] h-4 border-border text-muted-foreground">{role.department}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                                        <span>${role.defaultBillableRate}/hr</span>
                                    </div>
                                </div>
                            ))
                        )}
                        <Button variant="outline" className="w-full border-dashed border-border text-muted-foreground hover:text-foreground" onClick={resetForm}>
                            <Plus className="mr-2 size-3" /> New Role
                        </Button>
                    </div>

                    {/* Form Section */}
                    <div className="w-2/3 p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                                {editingRole ? `Editing: ${editingRole.roleName}` : "Create New Role"}
                            </h3>
                            {editingRole && (
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(editingRole.id)} className="h-7 text-xs">
                                    <Trash2 className="mr-1 size-3" /> Delete
                                </Button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Role Name</Label>
                                    <Input
                                        value={formData.roleName}
                                        onChange={e => setFormData({ ...formData, roleName: e.target.value })}
                                        className="bg-background border-border"
                                        placeholder="Senior Designer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Department</Label>
                                    <Input
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        className="bg-background border-border"
                                        placeholder="Creative"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 w-1/2 pr-2">
                                <Label className="text-muted-foreground">Default Billable Rate ($/hr)</Label>
                                <Input
                                    type="number"
                                    value={formData.defaultBillableRate}
                                    onChange={e => setFormData({ ...formData, defaultBillableRate: e.target.value })}
                                    className="bg-background border-border text-green-500 font-mono"
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-muted-foreground">Allowed Activities / Skills</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newActivity}
                                        onChange={e => setNewActivity(e.target.value)}
                                        placeholder="Add activity (e.g. UI Design)"
                                        className="bg-background border-border"
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                                    />
                                    <Button type="button" onClick={handleAddActivity} variant="secondary" className="border border-border bg-muted"><Plus className="size-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-2 p-3 bg-background/50 rounded-sm border border-border min-h-[60px]">
                                    {currentActivities.length === 0 && <span className="text-xs text-muted-foreground italic">No activities defined</span>}
                                    {currentActivities.map(activity => (
                                        <Badge key={activity} className="bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer pr-1" onClick={() => removeActivity(activity)}>
                                            {activity} <span className="ml-1 text-muted-foreground hover:text-red-400">×</span>
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={resetForm}>Clear</Button>
                                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Save className="mr-2 size-4" /> Save Configuration
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
