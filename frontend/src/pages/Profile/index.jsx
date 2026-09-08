import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { User, Mail, Shield, Check, AlertTriangle } from 'lucide-react';

export default function Profile() {
  const { user, fetchUser } = useAuth();
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setProfileMessage('');
    try {
      await api.put('/auth/profile', { full_name: fullName, email });
      await fetchUser();
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordMessage('');
    try {
      await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPasswordMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password.');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 overflow-hidden border-2 border-primary/20">
              {user.profile_image ? (
                <img src={`http://localhost:8000${user.profile_image}`} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            <CardTitle>{user.full_name || user.username}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="secondary" className="capitalize">{user.role} Account</Badge>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="email"
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <Button type="submit">Save Changes</Button>
                  {profileMessage && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="h-4 w-4" /> {profileMessage}</span>}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <div className="relative">
                    <Shield className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password"
                      value={currentPassword} 
                      onChange={e => setCurrentPassword(e.target.value)} 
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <Input 
                      type="password"
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <Input 
                      type="password"
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <Button type="submit" variant="secondary">Update Password</Button>
                  {passwordMessage && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="h-4 w-4" /> {passwordMessage}</span>}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
