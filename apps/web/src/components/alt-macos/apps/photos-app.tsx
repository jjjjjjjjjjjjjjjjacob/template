import { api } from '@template/backend';
import { useQuery } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
import { MacScrollArea } from '@/components/alt-macos/mac-scroll-area';

interface Project {
  id: string;
  title: string;
  company: string;
  timeline: string;
  role: string;
  description: string;
  achievements: Array<{
    description: string;
    impact?: string;
    technologies: string[];
    type: string;
  }>;
  previews: string[];
  url?: string;
}

interface PhotoBoothPhoto {
  _id: string;
  url: string | null;
  createdAt: number;
  effect?: string;
}

interface PhotosAppProps {
  projects: Project[];
}

type SidebarSection = 'LIBRARY' | 'RECENT' | 'ALBUMS' | 'PROJECTS';
type SidebarIconTone =
  | 'library'
  | 'recent'
  | 'flagged'
  | 'album'
  | 'project'
  | 'trash';
type BrowserMode = 'event' | 'photo';

interface BrowserItem {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  description: string;
  imageUrl?: string;
  photoCount: number;
  projectId?: string;
  openCollectionId?: string;
  badge?: string;
  mode: BrowserMode;
}

interface CollectionDef {
  id: string;
  label: string;
  section: SidebarSection;
  iconTone: SidebarIconTone;
  mode: BrowserMode;
  items: BrowserItem[];
  emptyTitle: string;
  emptyDescription: string;
}

const SIDEBAR_SECTION_ORDER: SidebarSection[] = [
  'LIBRARY',
  'RECENT',
  'ALBUMS',
  'PROJECTS',
];

const LEFT_ACTIONS = ['Merge', 'New Event', 'Edit'] as const;
const RIGHT_ACTIONS = [
  'Book',
  'Calendar',
  'Card',
  'Web Gallery',
  'Email',
  'Print',
  'Order Prints',
] as const;

export function PhotosApp({ projects }: PhotosAppProps) {
  const queriedBoothPhotos = useQuery(api.photobooth.listPhotos);
  const boothPhotos = useMemo(
    () => (queriedBoothPhotos ?? []) as PhotoBoothPhoto[],
    [queriedBoothPhotos]
  );
  const [activeCollectionId, setActiveCollectionId] = useState('events');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const allEventItems = useMemo<BrowserItem[]>(
    () =>
      projects.map((project) => {
        const previewUrls = getPreviewUrls(project.previews);

        return {
          id: `event:${project.id}`,
          title: project.title,
          subtitle: project.company || project.role || 'Portfolio Project',
          meta: project.timeline || 'Untitled event',
          description: project.description,
          imageUrl: previewUrls[0],
          photoCount: previewUrls.length,
          projectId: project.id,
          openCollectionId: `album:${project.id}`,
          badge:
            previewUrls.length > 0
              ? `${previewUrls.length} photo${previewUrls.length === 1 ? '' : 's'}`
              : 'Empty',
          mode: 'event',
        };
      }),
    [projects]
  );

  const allPhotoItems = useMemo<BrowserItem[]>(
    () =>
      projects.flatMap((project) => {
        const previewUrls = getPreviewUrls(project.previews);

        return previewUrls.map((url, index) => ({
          id: `photo:${project.id}:${index}`,
          title: project.title,
          subtitle: project.company || project.role || 'Portfolio Project',
          meta:
            previewUrls.length > 1
              ? `Photo ${index + 1} of ${previewUrls.length}`
              : project.timeline || 'Single photo',
          description: project.description,
          imageUrl: url,
          photoCount: 1,
          projectId: project.id,
          badge: project.timeline,
          mode: 'photo' as const,
        }));
      }),
    [projects]
  );

  const boothPhotoItems = useMemo<BrowserItem[]>(
    () =>
      boothPhotos.map((photo, index) => ({
        id: `booth:${photo._id}`,
        title:
          photo.effect && photo.effect !== 'normal'
            ? photo.effect
            : 'Photo Booth',
        subtitle: 'Last Import',
        meta: formatImportedAt(photo.createdAt, index),
        description: 'Imported from Photo Booth.',
        imageUrl: photo.url ?? undefined,
        photoCount: 1,
        badge: 'Imported',
        mode: 'photo',
      })),
    [boothPhotos]
  );

  const projectAlbumCollections = useMemo<CollectionDef[]>(
    () =>
      projects.map((project) => {
        const previewUrls = getPreviewUrls(project.previews);

        return {
          id: `album:${project.id}`,
          label: project.title,
          section: 'ALBUMS',
          iconTone: 'album',
          mode: 'photo',
          items: previewUrls.map((url, index) => ({
            id: `album-photo:${project.id}:${index}`,
            title: project.title,
            subtitle: project.company || project.role || 'Portfolio Project',
            meta:
              previewUrls.length > 1
                ? `Photo ${index + 1} of ${previewUrls.length}`
                : project.timeline || 'Single photo',
            description: project.description,
            imageUrl: url,
            photoCount: 1,
            projectId: project.id,
            badge: project.timeline,
            mode: 'photo' as const,
          })),
          emptyTitle: 'No photos in this album',
          emptyDescription:
            'Add project preview images to make this album feel like classic iPhoto.',
        };
      }),
    [projects]
  );

  const flaggedItems = useMemo(() => {
    const filtered = projects
      .filter(
        (project) => project.achievements.length >= 4 || Boolean(project.url)
      )
      .map((project) =>
        allEventItems.find((item) => item.projectId === project.id)
      )
      .filter((item): item is BrowserItem => Boolean(item));

    return filtered.length > 0 ? filtered : allEventItems.slice(0, 4);
  }, [allEventItems, projects]);

  const projectCollections = useMemo<CollectionDef[]>(() => {
    const publishedEvents = projects
      .filter((project) => project.url)
      .map((project) =>
        allEventItems.find((item) => item.projectId === project.id)
      )
      .filter((item): item is BrowserItem => Boolean(item));

    return [
      {
        id: 'portfolio-book',
        label: 'Portfolio Book',
        section: 'PROJECTS',
        iconTone: 'project',
        mode: 'event',
        items: allEventItems.slice(0, 8),
        emptyTitle: 'No projects in the book',
        emptyDescription:
          'Projects with previews appear here as polished event cards.',
      },
      {
        id: 'contact-sheet',
        label: 'Contact Sheet',
        section: 'PROJECTS',
        iconTone: 'project',
        mode: 'photo',
        items: allPhotoItems,
        emptyTitle: 'No photos in the contact sheet',
        emptyDescription:
          'Project preview images will appear here once they are available.',
      },
      {
        id: 'published',
        label: 'Published',
        section: 'PROJECTS',
        iconTone: 'project',
        mode: 'event',
        items: publishedEvents,
        emptyTitle: 'Nothing published yet',
        emptyDescription:
          'Published case studies will show up here automatically.',
      },
      {
        id: 'photo-booth-roll',
        label: 'Photo Booth',
        section: 'PROJECTS',
        iconTone: 'project',
        mode: 'photo',
        items: boothPhotoItems,
        emptyTitle: 'No Photo Booth imports',
        emptyDescription:
          'Take a snapshot in Photo Booth and it will land here as the newest import.',
      },
    ];
  }, [allEventItems, allPhotoItems, boothPhotoItems, projects]);

  const collections = useMemo<CollectionDef[]>(() => {
    const latestImportItems =
      boothPhotoItems.length > 0
        ? boothPhotoItems.slice(0, 12)
        : allPhotoItems.slice(0, 12);

    return [
      {
        id: 'events',
        label: 'Events',
        section: 'LIBRARY',
        iconTone: 'library',
        mode: 'event',
        items: allEventItems,
        emptyTitle: 'No events yet',
        emptyDescription:
          'Projects with preview media will appear as iPhoto events here.',
      },
      {
        id: 'photos',
        label: 'Photos',
        section: 'LIBRARY',
        iconTone: 'library',
        mode: 'photo',
        items: [
          ...latestImportItems,
          ...allPhotoItems.filter(
            (item) => !latestImportItems.some((latest) => latest.id === item.id)
          ),
        ],
        emptyTitle: 'No photos in the library',
        emptyDescription:
          'Add preview images to your projects to populate the main photo browser.',
      },
      {
        id: 'last-import',
        label: 'Last Import',
        section: 'RECENT',
        iconTone: 'recent',
        mode: 'photo',
        items: latestImportItems,
        emptyTitle: 'No recent imports',
        emptyDescription:
          'New Photo Booth captures or project previews will show up here first.',
      },
      {
        id: 'flagged',
        label: 'Flagged',
        section: 'RECENT',
        iconTone: 'flagged',
        mode: 'event',
        items: flaggedItems,
        emptyTitle: 'Nothing flagged',
        emptyDescription:
          'Featured projects will surface here once they have previews or live links.',
      },
      {
        id: 'trash',
        label: 'Trash',
        section: 'RECENT',
        iconTone: 'trash',
        mode: 'photo',
        items: [],
        emptyTitle: 'Trash is empty',
        emptyDescription: 'Classic iPhoto clutter without the clutter.',
      },
      ...projectAlbumCollections,
      ...projectCollections,
    ];
  }, [
    allEventItems,
    allPhotoItems,
    boothPhotoItems,
    flaggedItems,
    projectAlbumCollections,
    projectCollections,
  ]);

  const collectionMap = useMemo(
    () => new Map(collections.map((collection) => [collection.id, collection])),
    [collections]
  );

  const activeCollection =
    collectionMap.get(activeCollectionId) ?? collections[0];
  const selectedItem =
    activeCollection?.items.find((item) => item.id === selectedItemId) ??
    activeCollection?.items[0] ??
    null;
  const selectedIndex = selectedItem
    ? activeCollection.items.findIndex((item) => item.id === selectedItem.id)
    : -1;

  useEffect(() => {
    if (!activeCollection && collections.length > 0) {
      setActiveCollectionId(collections[0].id);
      return;
    }

    if (!activeCollection) {
      return;
    }

    const selectionStillVisible =
      selectedItemId !== null &&
      activeCollection.items.some((item) => item.id === selectedItemId);

    if (!selectionStillVisible) {
      setSelectedItemId(activeCollection.items[0]?.id ?? null);
    }
  }, [activeCollection, collections, selectedItemId]);

  if (!activeCollection) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #d7d7d7 0%, #bbbbbb 100%)',
        }}
      >
        <span className="text-[12px]" style={{ color: '#5a5a5a' }}>
          Loading iPhoto library...
        </span>
      </div>
    );
  }

  const statusLabel = getStatusLabel(
    activeCollection,
    selectedIndex,
    selectedItem
  );

  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-col"
      style={{
        background: '#b8b8b8',
        fontFamily: "'Lucida Grande', Geneva, 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        className="flex h-[30px] shrink-0 items-center justify-between border-b px-3"
        style={{
          background:
            'linear-gradient(180deg, #dbdbdb 0%, #c4c4c4 45%, #b0b0b0 100%)',
          borderColor: '#8f8f8f',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
        }}
      >
        <div className="flex items-center gap-2">
          <ToolbarChromeButton
            label="Events"
            active={activeCollection.mode === 'event'}
          />
          <ToolbarChromeButton
            label="Photos"
            active={activeCollection.mode === 'photo'}
          />
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[12px] font-semibold"
            style={{
              color: '#3c3c3c',
              textShadow: '0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            {activeCollection.label}
          </span>
          <div
            className="rounded-full px-2 py-[2px] text-[10px]"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(230,230,230,0.8) 100%)',
              border: '1px solid rgba(0,0,0,0.15)',
              color: '#666',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            {activeCollection.items.length} item
            {activeCollection.items.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1">
        <aside
          className="flex w-[178px] shrink-0 flex-col border-r"
          style={{
            background:
              'linear-gradient(180deg, #d7dde7 0%, #c0c8d5 28%, #bac4d2 100%)',
            borderColor: '#919aa8',
            boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.55)',
          }}
        >
          <MacScrollArea
            className="min-h-0 flex-1"
            orientation="vertical"
            viewportClassName="px-2 py-2"
          >
            {SIDEBAR_SECTION_ORDER.map((section) => {
              const sectionCollections = collections.filter(
                (collection) => collection.section === section
              );

              if (sectionCollections.length === 0) {
                return null;
              }

              return (
                <div key={section} className="mb-3">
                  <div
                    className="px-2 pb-1 text-[9px] font-bold tracking-[0.14em]"
                    style={{ color: '#6d7682' }}
                  >
                    {section}
                  </div>
                  <div className="space-y-[1px]">
                    {sectionCollections.map((collection) => {
                      const isActive = collection.id === activeCollection.id;

                      return (
                        <button
                          key={collection.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-[4px] px-2 py-[3px] text-left text-[11px]"
                          style={{
                            background: isActive
                              ? 'linear-gradient(180deg, #4f8ddb 0%, #2a6fc2 100%)'
                              : 'transparent',
                            color: isActive ? '#fff' : '#333f4b',
                            textShadow: isActive
                              ? '0 -1px 0 rgba(0,0,0,0.25)'
                              : '0 1px 0 rgba(255,255,255,0.65)',
                            boxShadow: isActive
                              ? 'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.14)'
                              : 'none',
                          }}
                          onClick={() => {
                            setActiveCollectionId(collection.id);
                            setSelectedItemId(collection.items[0]?.id ?? null);
                          }}
                        >
                          <SidebarBullet
                            tone={collection.iconTone}
                            active={isActive}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {collection.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </MacScrollArea>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div
            className="flex h-[28px] shrink-0 items-center justify-between border-b px-4"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(235,235,235,0.2) 100%)',
              borderColor: 'rgba(0,0,0,0.2)',
              color: '#434343',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
            }}
          >
            <span className="text-[11px] font-bold">
              {activeCollection.label}
            </span>
            <span className="text-[10px]" style={{ color: '#666' }}>
              {activeCollection.mode === 'event' ? 'Event View' : 'Photo View'}
            </span>
          </div>

          <MacScrollArea
            className="min-h-0 flex-1"
            viewportClassName="px-5 py-4"
            style={{
              background:
                'linear-gradient(180deg, #b7b7b7 0%, #a7a7a7 16%, #959595 100%)',
              boxShadow: 'inset 0 8px 14px rgba(255,255,255,0.14)',
            }}
          >
            {activeCollection.items.length > 0 ? (
              <div className="flex flex-wrap content-start gap-x-5 gap-y-4">
                {activeCollection.items.map((item) => {
                  const isSelected = item.id === selectedItem?.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="group w-[126px] text-left"
                      onClick={() => setSelectedItemId(item.id)}
                      onDoubleClick={() => {
                        if (
                          item.openCollectionId &&
                          collectionMap.has(item.openCollectionId)
                        ) {
                          const nextCollection = collectionMap.get(
                            item.openCollectionId
                          )!;
                          setActiveCollectionId(nextCollection.id);
                          setSelectedItemId(
                            nextCollection.items[0]?.id ?? null
                          );
                        }
                      }}
                    >
                      <div
                        className="overflow-hidden rounded-[14px]"
                        style={{
                          background:
                            'linear-gradient(180deg, #1e1e1e 0%, #080808 100%)',
                          border: isSelected
                            ? '2px solid #f4d86a'
                            : '2px solid rgba(255,255,255,0.08)',
                          boxShadow: isSelected
                            ? '0 0 0 1px rgba(126,84,0,0.9), 0 6px 18px rgba(0,0,0,0.35)'
                            : '0 5px 16px rgba(0,0,0,0.28)',
                          padding: '6px',
                        }}
                      >
                        <div
                          className="relative overflow-hidden rounded-[10px]"
                          style={{
                            height: '88px',
                            background: item.imageUrl
                              ? '#101010'
                              : getPlaceholderBackground(item.title),
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                          }}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              draggable={false}
                            />
                          ) : (
                            <div
                              className="flex h-full w-full items-end p-3"
                              style={{
                                background:
                                  'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.22) 100%)',
                              }}
                            >
                              <span
                                className="text-[22px] font-bold uppercase"
                                style={{
                                  color: 'rgba(255,255,255,0.84)',
                                  letterSpacing: '0.08em',
                                  textShadow: '0 1px 4px rgba(0,0,0,0.35)',
                                }}
                              >
                                {getInitials(item.title)}
                              </span>
                            </div>
                          )}

                          {item.badge ? (
                            <div
                              className="absolute right-[6px] bottom-[6px] rounded-full px-[6px] py-[2px] text-[9px]"
                              style={{
                                background: 'rgba(0,0,0,0.7)',
                                color: '#f1f1f1',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                              }}
                            >
                              {item.badge}
                            </div>
                          ) : null}
                        </div>

                        <div className="px-[2px] pt-[6px]">
                          <div
                            className="truncate text-center text-[11px] font-bold"
                            style={{
                              color: '#fff',
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            className="mt-[1px] truncate text-center text-[9px]"
                            style={{ color: 'rgba(255,255,255,0.72)' }}
                          >
                            {item.mode === 'event' ? item.subtitle : item.meta}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-[260px] items-center justify-center">
                <div
                  className="max-w-[360px] rounded-[18px] px-8 py-7 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.16)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
                  }}
                >
                  <div
                    className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      background:
                        'linear-gradient(180deg, #fbfbfb 0%, #d8d8d8 100%)',
                      border: '1px solid rgba(0,0,0,0.15)',
                      color: '#6a6a6a',
                      fontSize: '20px',
                      fontWeight: 700,
                    }}
                  >
                    i
                  </div>
                  <div
                    className="text-[14px] font-bold"
                    style={{
                      color: '#2f2f2f',
                      textShadow: '0 1px 0 rgba(255,255,255,0.4)',
                    }}
                  >
                    {activeCollection.emptyTitle}
                  </div>
                  <p
                    className="mt-2 text-[11px]"
                    style={{ color: '#4f4f4f', lineHeight: 1.5 }}
                  >
                    {activeCollection.emptyDescription}
                  </p>
                </div>
              </div>
            )}
          </MacScrollArea>

          <div
            className="flex h-[24px] shrink-0 items-center justify-between border-t px-3"
            style={{
              background: 'linear-gradient(180deg, #c8c8c8 0%, #b7b7b7 100%)',
              borderColor: '#8f8f8f',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)',
            }}
          >
            <span className="text-[10px]" style={{ color: '#555' }}>
              {selectedItem
                ? `${selectedItem.title}  ${selectedItem.subtitle}`
                : activeCollection.label}
            </span>
            <span className="text-[10px]" style={{ color: '#666' }}>
              {statusLabel}
            </span>
          </div>

          <div
            className="flex h-[38px] shrink-0 items-center justify-between border-t px-2"
            style={{
              background: 'linear-gradient(180deg, #d3d3d3 0%, #b4b4b4 100%)',
              borderColor: '#8f8f8f',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
            }}
          >
            <div className="flex items-center gap-[6px]">
              {LEFT_ACTIONS.map((action) => (
                <ActionButton key={action} label={action} />
              ))}
            </div>
            <div className="flex items-center gap-[6px]">
              {RIGHT_ACTIONS.map((action) => (
                <ActionButton key={action} label={action} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ToolbarChromeButton({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <div
      className="rounded-[4px] px-2 py-[2px] text-[10px] font-bold"
      style={{
        background: active
          ? 'linear-gradient(180deg, #8fa0b4 0%, #6f8298 100%)'
          : 'linear-gradient(180deg, #efefef 0%, #cdcdcd 100%)',
        border: '1px solid rgba(0,0,0,0.16)',
        color: active ? '#fff' : '#515151',
        textShadow: active
          ? '0 -1px 0 rgba(0,0,0,0.28)'
          : '0 1px 0 rgba(255,255,255,0.55)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
      }}
    >
      {label}
    </div>
  );
}

function SidebarBullet({
  tone,
  active,
}: {
  tone: SidebarIconTone;
  active: boolean;
}) {
  const palette: Record<SidebarIconTone, { bg: string; border: string }> = {
    library: { bg: '#ef9e1b', border: '#be7411' },
    recent: { bg: '#5f8dd5', border: '#3566b6' },
    flagged: { bg: '#f0c847', border: '#bc9422' },
    album: { bg: '#cf7e29', border: '#955415' },
    project: { bg: '#7c90a8', border: '#566678' },
    trash: { bg: '#a8afb7', border: '#737b85' },
  };

  const colors = palette[tone];

  return (
    <span
      aria-hidden="true"
      className="inline-block rounded-[3px]"
      style={{
        width: '10px',
        height: '10px',
        background: active ? 'rgba(255,255,255,0.92)' : colors.bg,
        border: `1px solid ${active ? 'rgba(0,0,0,0.22)' : colors.border}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
      }}
    />
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex h-[26px] items-center gap-[5px] rounded-[6px] px-2 text-[10px]"
      style={{
        background: 'linear-gradient(180deg, #f7f7f7 0%, #d3d3d3 100%)',
        border: '1px solid rgba(0,0,0,0.18)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
        color: '#4c4c4c',
        textShadow: '0 1px 0 rgba(255,255,255,0.65)',
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block rounded-full"
        style={{
          width: '10px',
          height: '10px',
          background: 'linear-gradient(180deg, #d7b15b 0%, #bb8a2f 100%)',
          border: '1px solid rgba(0,0,0,0.14)',
        }}
      />
      <span>{label}</span>
    </button>
  );
}

function getInitials(value: string) {
  const words = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function getPreviewUrls(previews: string[]) {
  return previews.filter((url): url is string => Boolean(url));
}

function getPlaceholderBackground(value: string) {
  const seed =
    Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0) %
    360;
  const next = (seed + 54) % 360;

  return `linear-gradient(135deg, hsl(${seed} 58% 62%) 0%, hsl(${next} 44% 34%) 100%)`;
}

function formatImportedAt(createdAt: number, offset: number) {
  if (!createdAt) {
    return offset === 0 ? 'Just now' : `Import ${offset + 1}`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(createdAt));
}

function getStatusLabel(
  collection: CollectionDef,
  selectedIndex: number,
  selectedItem: BrowserItem | null
) {
  const photoCount =
    collection.mode === 'event'
      ? collection.items.reduce((total, item) => total + item.photoCount, 0)
      : collection.items.length;
  const eventCount =
    collection.mode === 'event'
      ? collection.items.length
      : Math.max(
          new Set(
            collection.items.map((item) => item.projectId).filter(Boolean)
          ).size,
          collection.items.length > 0 ? 1 : 0
        );

  if (collection.items.length === 0) {
    return '0 photos in 0 events';
  }

  const lead =
    selectedIndex >= 0 && selectedItem
      ? `${selectedIndex + 1} of ${collection.items.length}`
      : `${collection.items.length} items`;
  const photosLabel = `${photoCount} photo${photoCount === 1 ? '' : 's'}`;
  const eventsLabel = `${eventCount} event${eventCount === 1 ? '' : 's'}`;

  return `${lead}  ${photosLabel} in ${eventsLabel}`;
}
