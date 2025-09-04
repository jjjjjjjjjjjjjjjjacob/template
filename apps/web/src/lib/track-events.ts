/**
 * Project-specific event tracking helpers for PostHog.
 *
 * For standard PostHog functionality, use the native hooks directly:
 * - import { usePostHog } from 'posthog-js/react' - for capture, identify, reset, etc.
 * - import { useFeatureFlagEnabled } from 'posthog-js/react' - for feature flags
 * - import { useFeatureFlagPayload } from 'posthog-js/react' - for flag payloads
 *
 * This file only contains project-specific event definitions to ensure consistency.
 */

import posthog from 'posthog-js';

/**
 * Helper function to safely capture events only when PostHog is initialized
 */
function safeCapture(eventName: string, properties?: Record<string, unknown>) {
  // Only capture if PostHog is initialized and not opted out
  if (typeof window !== 'undefined' && posthog.__loaded) {
    try {
      posthog.capture(eventName, properties);
    } catch (error) {
      console.error('PostHog event capture failed:', error);
    }
  }
}

/**
 * Centralized event tracking functions for consistency across the app.
 * These wrap safeCapture() with predefined event names and properties.
 */
export const trackEvents = {
  // User actions
  userSignedUp: (userId: string, method: string) =>
    safeCapture('user_signed_up', { method, user_id: userId }),

  userSignedIn: (userId: string, method: string) =>
    safeCapture('user_signed_in', { method, user_id: userId }),

  userSignedOut: () => safeCapture('user_signed_out'),

  // Navigation
  pageViewed: (path: string, title?: string) =>
    safeCapture('page_viewed', { path, title }),

  navLinkClicked: (
    linkName: string,
    fromSection: string,
    toSection?: string,
    scrollPosition?: number
  ) =>
    safeCapture('nav_link_clicked', {
      link_name: linkName,
      from_section: fromSection,
      to_section: toSection,
      scroll_position: scrollPosition,
    }),

  sectionScrolled: (sectionName: string, scrollPosition: number) =>
    safeCapture('section_scrolled', {
      section_name: sectionName,
      scroll_position: scrollPosition,
    }),

  // Conversion Events (Key Business Metrics)
  resumeDownloaded: (format: 'pdf' | 'png', theme: string, source: string) =>
    safeCapture('resume_downloaded', {
      format,
      theme,
      source,
      timestamp: Date.now(),
    }),

  resumeDownloadAttempted: (
    format: 'pdf' | 'png',
    source: string,
    success: boolean,
    error?: string
  ) =>
    safeCapture('resume_download_attempted', {
      format,
      source,
      success,
      error,
      timestamp: Date.now(),
    }),

  contactInitiated: (
    contactType: 'email' | 'github' | 'twitter',
    location: string,
    url: string
  ) =>
    safeCapture('contact_initiated', {
      contact_type: contactType,
      location,
      url,
    }),

  // Project Interactions
  projectVisited: (projectName: string, projectUrl: string, source: string) =>
    safeCapture('project_visited', {
      project_name: projectName,
      project_url: projectUrl,
      source,
    }),

  projectIframeInteracted: (
    projectName: string,
    interactionType: 'click' | 'hover' | 'focus',
    duration?: number
  ) =>
    safeCapture('project_iframe_interacted', {
      project_name: projectName,
      interaction_type: interactionType,
      duration,
    }),

  projectSlideshowInteracted: (
    projectName: string,
    action: 'next' | 'previous' | 'click' | 'swipe' | 'hover' | 'dialog_opened',
    slideIndex?: number
  ) =>
    safeCapture('project_slideshow_interacted', {
      project_name: projectName,
      action,
      slide_index: slideIndex,
    }),

  // Hero Section Interactions
  heroButtonClicked: (
    buttonType: 'cta' | 'secondary' | 'scroll_indicator',
    buttonText: string,
    destination?: string
  ) =>
    safeCapture('hero_button_clicked', {
      button_type: buttonType,
      button_text: buttonText,
      destination,
    }),

  // Social Media Interactions
  socialLinkClicked: (
    platform: 'github' | 'twitter' | 'email',
    location: string,
    url: string
  ) =>
    safeCapture('social_link_clicked', {
      platform,
      location,
      url,
    }),

  // UI interactions
  modalOpened: (modalType: string, context?: Record<string, unknown>) =>
    safeCapture('modal_opened', { modal_type: modalType, ...context }),

  modalClosed: (modalType: string, context?: Record<string, unknown>) =>
    safeCapture('modal_closed', { modal_type: modalType, ...context }),

  popoverOpened: (popoverType: string, location: string) =>
    safeCapture('popover_opened', { popover_type: popoverType, location }),

  popoverClosed: (popoverType: string, location: string) =>
    safeCapture('popover_closed', { popover_type: popoverType, location }),

  buttonClicked: (
    buttonName: string,
    location: string,
    context?: Record<string, unknown>
  ) =>
    safeCapture('button_clicked', {
      button_name: buttonName,
      location,
      ...context,
    }),

  // Errors
  errorOccurred: (error: string, context?: Record<string, unknown>) =>
    safeCapture('error_occurred', { error, ...context }),

  // Performance
  componentPerformance: (
    componentName: string,
    eventType: 'mount' | 'unmount' | 'rerender' | 'prop_change',
    value?: number,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('component_performance', {
      component_name: componentName,
      event_type: eventType,
      value,
      ...properties,
    }),

  // Feature usage
  featureUsed: (
    featureName: string,
    action: string,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('feature_used', {
      feature_name: featureName,
      action,
      ...properties,
    }),

  // Theme changes
  themeChanged: (theme: string, colorTheme?: string) =>
    safeCapture('theme_changed', { theme, color_theme: colorTheme }),

  themeToggleClicked: (fromTheme: string, toTheme: string, location: string) =>
    safeCapture('theme_toggle_clicked', {
      from_theme: fromTheme,
      to_theme: toTheme,
      location,
    }),
} as const;
