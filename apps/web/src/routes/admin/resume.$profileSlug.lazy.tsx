import { createLazyFileRoute, useRouter, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@template/backend';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/features/auth/hooks/use-admin';
import { ResumeProjectManager } from '@/components/admin/resume-project-manager';

export const Route = createLazyFileRoute('/admin/resume/$profileSlug')({
  component: EditProfilePage,
});

interface TagInputProps {
  label: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

function TagInput({
  label,
  tags,
  onTagsChange,
  placeholder,
  suggestions = [],
}: TagInputProps) {
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
    (s) =>
      !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
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

function EditProfilePage() {
  const { profileSlug } = Route.useParams();
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const upsertProfileMutation = useMutation(api.resume.upsertProfile);
  const deleteProfileMutation = useMutation(api.resume.deleteProfile);
  const profiles = useQuery(api.resume.listProfiles);

  const profileData = useQuery(api.resume.getProfile, { slug: profileSlug });

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
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profileData) {
      setFormData({
        slug: profileData.profile.slug,
        name: profileData.profile.name,
        title: profileData.profile.title,
        location: profileData.profile.location,
        summary: profileData.profile.summary,
        email: profileData.profile.contact.email || '',
        linkedin: profileData.profile.contact.linkedin || '',
        github: profileData.profile.contact.github || '',
        website: profileData.profile.contact.website || '',
        order:
          profiles?.find((p) => p.slug === profileData.profile.slug)?.order ??
          0,
      });
      setFocusAreas(profileData.profile.defaults.focusAreas);
      setTopTechnologies(profileData.profile.defaults.topTechnologies);
      setPriorityDomains(profileData.profile.defaults.priorityDomains);
      setHasChanges(false);
    }
  }, [profileData, profiles]);

  const markChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
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
        projects:
          profileData?.projects.map((p) => ({
            projectSlug: p.slug,
            displayOrder: p.displayOrder,
            achievementFilter: p.achievementFilter,
          })) ?? [],
        skills: profileData?.skills ?? [],
      });

      toast.success('profile saved');
      setHasChanges(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'failed to save profile'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `are you sure you want to delete "${formData.name}"? this will also delete all associated projects and skills.`
      )
    ) {
      return;
    }

    try {
      await deleteProfileMutation({ slug: profileSlug });
      toast.success('profile deleted');
      router.navigate({ to: '/admin/resume' });
    } catch {
      toast.error('failed to delete profile');
    }
  };

  const isLoading = authLoading || profileData === undefined;

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="flex items-center justify-center py-12">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
          <span className="ml-2">loading...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <Card className="admin-card border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              you do not have permission to access this area.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="admin-page">
        <Card className="admin-card border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">profile not found</p>
            <Link to="/admin/resume">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                back to profiles
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="admin-page admin-page-wide">
      <div className="admin-page-header">
        <div className="flex items-center gap-4">
          <Link to="/admin/resume">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div>
                <p className="admin-page-kicker">resume</p>
                <h1 className="admin-page-title">edit profile</h1>
              </div>
              {hasChanges && (
                <Badge variant="outline" className="text-orange-500">
                  unsaved
                </Badge>
              )}
            </div>
            <p className="admin-page-description">{profileData.profile.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            delete
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'saving...' : 'save'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="font-light">profile details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slug">slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => {
                      setFormData({ ...formData, slug: e.target.value });
                      markChanged();
                    }}
                    placeholder="my-profile"
                    disabled
                  />
                  <p className="text-muted-foreground text-xs">
                    slug cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      markChanged();
                    }}
                    placeholder="john doe"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      markChanged();
                    }}
                    placeholder="senior software engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        location: e.target.value,
                      });
                      markChanged();
                    }}
                    placeholder="new york, ny"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => {
                    setFormData({ ...formData, summary: e.target.value });
                    markChanged();
                  }}
                  placeholder="brief professional summary..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="font-light">contact information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      markChanged();
                    }}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">linkedin</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        linkedin: e.target.value,
                      });
                      markChanged();
                    }}
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="github">github</Label>
                  <Input
                    id="github"
                    value={formData.github}
                    onChange={(e) => {
                      setFormData({ ...formData, github: e.target.value });
                      markChanged();
                    }}
                    placeholder="github.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        website: e.target.value,
                      });
                      markChanged();
                    }}
                    placeholder="example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-light">
              projects ({profileData.projects.length})
            </h2>
            <ResumeProjectManager profileSlug={profileSlug} />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="font-light">default filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TagInput
                label="focus areas"
                tags={focusAreas}
                onTagsChange={(tags) => {
                  setFocusAreas(tags);
                  markChanged();
                }}
                placeholder="add focus area..."
                suggestions={FOCUS_AREA_SUGGESTIONS}
              />

              <TagInput
                label="top technologies"
                tags={topTechnologies}
                onTagsChange={(tags) => {
                  setTopTechnologies(tags);
                  markChanged();
                }}
                placeholder="add technology..."
                suggestions={TECHNOLOGY_SUGGESTIONS}
              />

              <TagInput
                label="priority domains"
                tags={priorityDomains}
                onTagsChange={(tags) => {
                  setPriorityDomains(tags);
                  markChanged();
                }}
                placeholder="add domain..."
                suggestions={DOMAIN_SUGGESTIONS}
              />
            </CardContent>
          </Card>

          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="font-light">ordering</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order">display order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    });
                    markChanged();
                  }}
                  placeholder="0"
                />
                <p className="text-muted-foreground text-xs">
                  lower numbers appear first in profile lists
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
