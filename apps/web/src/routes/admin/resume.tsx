import { createFileRoute, Link } from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@template/convex';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  User,
  GripVertical,
  ExternalLink,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/features/auth/hooks/use-admin';

export const Route = createFileRoute('/admin/resume')({
  component: ResumeAdminPage,
});

interface TagInputProps {
  label: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

function TagInput({ label, tags, onTagsChange, placeholder, suggestions = [] }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onTagsChange([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            list={`${label}-suggestions`}
          />
          {filteredSuggestions.length > 0 && inputValue && (
            <datalist id={`${label}-suggestions`}>
              {filteredSuggestions.slice(0, 5).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer gap-1 pr-1"
              onClick={() => handleRemove(tag)}
            >
              {tag}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

const FOCUS_AREA_SUGGESTIONS = [
  'fullstack',
  'frontend',
  'backend',
  'leadership',
  'product',
  'ai',
  '3d-graphics',
  'devops',
  'mobile',
  'customer-facing',
  'agent',
  'multimodal',
];

const TECHNOLOGY_SUGGESTIONS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Python',
  'Node.js',
  'Next.js',
  'TanStack Start',
  'Three.js',
  'Convex',
  'PostgreSQL',
  'AWS',
  'Terraform',
  'Docker',
  'Tailwind CSS',
  'NestJS',
  'GraphQL',
  'Redis',
  'MongoDB',
  'Clerk',
  'Stripe',
];

const DOMAIN_SUGGESTIONS = [
  'frontend',
  'backend',
  '3d',
  'realtime',
  'infrastructure',
  'social',
  'marketplace',
  'payments',
  'auth',
  'ai',
  'llm',
  'agent',
  'devops',
  'testing',
  'ml',
  'video',
  'search',
];

function ResumeAdminPage() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const profiles = useQuery(api.resume.listProfiles);
  const deleteProfileMutation = useMutation(api.resume.deleteProfile);
  const upsertProfileMutation = useMutation(api.resume.upsertProfile);

  const [showNewProfileDialog, setShowNewProfileDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editingProfileSlug, setEditingProfileSlug] = useState<string | null>(null);

  const editingProfileData = useQuery(
    api.resume.getProfile,
    editingProfileSlug ? { slug: editingProfileSlug } : 'skip'
  );

  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    title: '',
    location: '',
    summary: '',
    email: '',
    linkedin: '',
    github: '',
    website: '',
    order: 0,
  });

  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [topTechnologies, setTopTechnologies] = useState<string[]>([]);
  const [priorityDomains, setPriorityDomains] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingProfileData && showEditProfileDialog) {
      setFormData({
        slug: editingProfileData.profile.slug,
        name: editingProfileData.profile.name,
        title: editingProfileData.profile.title,
        location: editingProfileData.profile.location,
        summary: editingProfileData.profile.summary,
        email: editingProfileData.profile.contact.email || '',
        linkedin: editingProfileData.profile.contact.linkedin || '',
        github: editingProfileData.profile.contact.github || '',
        website: editingProfileData.profile.contact.website || '',
        order: profiles?.find(p => p.slug === editingProfileData.profile.slug)?.order ?? 0,
      });
      setFocusAreas(editingProfileData.profile.defaults.focusAreas);
      setTopTechnologies(editingProfileData.profile.defaults.topTechnologies);
      setPriorityDomains(editingProfileData.profile.defaults.priorityDomains);
    }
  }, [editingProfileData, showEditProfileDialog, profiles]);

  const isLoading = authLoading || profiles === undefined;

  const handleOpenNewDialog = () => {
    setFormData({
      slug: '',
      name: '',
      title: '',
      location: '',
      summary: '',
      email: '',
      linkedin: '',
      github: '',
      website: '',
      order: profiles?.length ?? 0,
    });
    setFocusAreas([]);
    setTopTechnologies([]);
    setPriorityDomains([]);
    setShowNewProfileDialog(true);
  };

  const handleEditProfile = (slug: string) => {
    setEditingProfileSlug(slug);
    setShowEditProfileDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditProfileDialog(false);
    setEditingProfileSlug(null);
    setFormData({
      slug: '',
      name: '',
      title: '',
      location: '',
      summary: '',
      email: '',
      linkedin: '',
      github: '',
      website: '',
      order: 0,
    });
    setFocusAreas([]);
    setTopTechnologies([]);
    setPriorityDomains([]);
  };

  const handleSaveEditProfile = async () => {
    if (!formData.slug.trim() || !formData.name.trim()) {
      toast.error('slug and name are required');
      return;
    }

    setIsSaving(true);

    try {
      await upsertProfileMutation({
        profile: {
          slug: formData.slug.trim(),
          name: formData.name.trim(),
          title: formData.title.trim(),
          location: formData.location.trim(),
          summary: formData.summary.trim(),
          contact: {
            email: formData.email.trim() || undefined,
            linkedin: formData.linkedin.trim() || undefined,
            github: formData.github.trim() || undefined,
            website: formData.website.trim() || undefined,
          },
          defaults: {
            focusAreas,
            topTechnologies,
            priorityDomains,
          },
          order: formData.order,
        },
        projects: editingProfileData?.projects ?? [],
        skills: editingProfileData?.skills ?? [],
      });

      toast.success('profile updated');
      handleCloseEditDialog();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'failed to update profile'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async (slug: string, name: string) => {
    if (
      !confirm(
        `are you sure you want to delete "${name}"? this will also delete all associated projects and skills.`
      )
    ) {
      return;
    }

    try {
      await deleteProfileMutation({ slug });
      toast.success('profile deleted');
    } catch {
      toast.error('failed to delete profile');
    }
  };

  const handleSaveNewProfile = async () => {
    if (!formData.slug.trim() || !formData.name.trim()) {
      toast.error('slug and name are required');
      return;
    }

    try {
      await upsertProfileMutation({
        profile: {
          slug: formData.slug.trim(),
          name: formData.name.trim(),
          title: formData.title.trim(),
          location: formData.location.trim(),
          summary: formData.summary.trim(),
          contact: {
            email: formData.email.trim() || undefined,
            linkedin: formData.linkedin.trim() || undefined,
            github: formData.github.trim() || undefined,
            website: formData.website.trim() || undefined,
          },
          defaults: {
            focusAreas,
            topTechnologies,
            priorityDomains,
          },
          order: formData.order,
        },
        projects: [],
        skills: [],
      });

      toast.success('profile created');
      setShowNewProfileDialog(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'failed to create profile'
      );
    }
  };

  if (isLoading) {
    return (
      <>
        <SignedOut>
          <RedirectToSignIn redirectUrl="/admin/resume" />
        </SignedOut>
        <SignedIn>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
              <span className="ml-2">loading...</span>
            </div>
          </div>
        </SignedIn>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <SignedOut>
          <RedirectToSignIn redirectUrl="/admin/resume" />
        </SignedOut>
        <SignedIn>
          <div className="container mx-auto px-4 py-8">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">
                  you do not have permission to access this area.
                </p>
              </CardContent>
            </Card>
          </div>
        </SignedIn>
      </>
    );
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin/resume" />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-light">resume profiles</h1>
                <p className="text-muted-foreground text-sm">
                  manage your resume configurations
                </p>
              </div>
            </div>
            <Button onClick={handleOpenNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              new profile
            </Button>
          </div>

          {!profiles || profiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-light">no profiles yet</h3>
                <p className="text-muted-foreground mb-4">
                  create your first resume profile to get started
                </p>
                <Button onClick={handleOpenNewDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  create profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <Card
                  key={profile.slug}
                  className="group relative overflow-hidden transition-shadow hover:shadow-lg"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                          <User className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-light">
                            {profile.name}
                          </CardTitle>
                          <p className="text-muted-foreground text-sm">
                            {profile.title}
                          </p>
                        </div>
                      </div>
                      <GripVertical className="text-muted-foreground h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{profile.slug}</Badge>
                      <Badge variant="secondary">order: {profile.order}</Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/resume?profile=${profile.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        view resume
                      </a>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditProfile(profile.slug)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() =>
                          handleDeleteProfile(profile.slug, profile.name)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog
            open={showNewProfileDialog}
            onOpenChange={setShowNewProfileDialog}
          >
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>create new profile</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-slug">slug</Label>
                    <Input
                      id="new-slug"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="my-profile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-name">name</Label>
                    <Input
                      id="new-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="john doe"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-title">title</Label>
                    <Input
                      id="new-title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="senior software engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-location">location</Label>
                    <Input
                      id="new-location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="new york, ny"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-summary">summary</Label>
                  <Textarea
                    id="new-summary"
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                    placeholder="brief professional summary..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-linkedin">linkedin</Label>
                    <Input
                      id="new-linkedin"
                      value={formData.linkedin}
                      onChange={(e) =>
                        setFormData({ ...formData, linkedin: e.target.value })
                      }
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-github">github</Label>
                    <Input
                      id="new-github"
                      value={formData.github}
                      onChange={(e) =>
                        setFormData({ ...formData, github: e.target.value })
                      }
                      placeholder="github.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-website">website</Label>
                    <Input
                      id="new-website"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      placeholder="example.com"
                    />
                  </div>
                </div>

                <TagInput
                  label="focus areas"
                  tags={focusAreas}
                  onTagsChange={setFocusAreas}
                  placeholder="add focus area..."
                  suggestions={FOCUS_AREA_SUGGESTIONS}
                />

                <TagInput
                  label="top technologies"
                  tags={topTechnologies}
                  onTagsChange={setTopTechnologies}
                  placeholder="add technology..."
                  suggestions={TECHNOLOGY_SUGGESTIONS}
                />

                <TagInput
                  label="priority domains"
                  tags={priorityDomains}
                  onTagsChange={setPriorityDomains}
                  placeholder="add domain..."
                  suggestions={DOMAIN_SUGGESTIONS}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowNewProfileDialog(false)}
                >
                  cancel
                </Button>
                <Button onClick={handleSaveNewProfile}>
                  <Save className="mr-2 h-4 w-4" />
                  create profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showEditProfileDialog}
            onOpenChange={(open) => {
              if (!open) handleCloseEditDialog();
            }}
          >
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>edit profile</DialogTitle>
              </DialogHeader>
              {!editingProfileData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="border-primary h-6 w-6 animate-spin rounded-full border-b-2" />
                  <span className="text-muted-foreground ml-2">loading profile...</span>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-slug">slug</Label>
                        <Input
                          id="edit-slug"
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                          }
                          placeholder="my-profile"
                          disabled
                        />
                        <p className="text-muted-foreground text-xs">
                          slug cannot be changed
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">name</Label>
                        <Input
                          id="edit-name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="john doe"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">title</Label>
                        <Input
                          id="edit-title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="senior software engineer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-location">location</Label>
                        <Input
                          id="edit-location"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({ ...formData, location: e.target.value })
                          }
                          placeholder="new york, ny"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-summary">summary</Label>
                      <Textarea
                        id="edit-summary"
                        value={formData.summary}
                        onChange={(e) =>
                          setFormData({ ...formData, summary: e.target.value })
                        }
                        placeholder="brief professional summary..."
                        rows={4}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-linkedin">linkedin</Label>
                        <Input
                          id="edit-linkedin"
                          value={formData.linkedin}
                          onChange={(e) =>
                            setFormData({ ...formData, linkedin: e.target.value })
                          }
                          placeholder="linkedin.com/in/username"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-github">github</Label>
                        <Input
                          id="edit-github"
                          value={formData.github}
                          onChange={(e) =>
                            setFormData({ ...formData, github: e.target.value })
                          }
                          placeholder="github.com/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-website">website</Label>
                        <Input
                          id="edit-website"
                          value={formData.website}
                          onChange={(e) =>
                            setFormData({ ...formData, website: e.target.value })
                          }
                          placeholder="example.com"
                        />
                      </div>
                    </div>

                    <TagInput
                      label="focus areas"
                      tags={focusAreas}
                      onTagsChange={setFocusAreas}
                      placeholder="add focus area..."
                      suggestions={FOCUS_AREA_SUGGESTIONS}
                    />

                    <TagInput
                      label="top technologies"
                      tags={topTechnologies}
                      onTagsChange={setTopTechnologies}
                      placeholder="add technology..."
                      suggestions={TECHNOLOGY_SUGGESTIONS}
                    />

                    <TagInput
                      label="priority domains"
                      tags={priorityDomains}
                      onTagsChange={setPriorityDomains}
                      placeholder="add domain..."
                      suggestions={DOMAIN_SUGGESTIONS}
                    />

                    <div className="rounded-lg border p-4">
                      <h4 className="mb-2 text-sm font-medium">profile stats</h4>
                      <div className="text-muted-foreground flex gap-4 text-sm">
                        <span>{editingProfileData.projects.length} projects</span>
                        <span>•</span>
                        <span>{editingProfileData.skills.length} skill categories</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseEditDialog}>
                      cancel
                    </Button>
                    <Button onClick={handleSaveEditProfile} disabled={isSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'saving...' : 'save changes'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </SignedIn>
    </>
  );
}

