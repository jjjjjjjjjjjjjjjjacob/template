import { SignUp } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';
import { SiteAuthShell } from '@/components/site/auth-shell';
import { useSiteVisuals } from '@/components/site/visual-provider';

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  const { theme } = useSiteVisuals();
  const dark = theme === 'dark';

  return (
    <SiteAuthShell
      eyebrow="private route / access"
      title="Create account"
      description="Create an account only if you have been invited to manage this portfolio."
    >
      <div className="site-auth-clerk">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          appearance={{
            variables: {
              colorPrimary: dark ? '#ecebe4' : '#1a1a18',
              colorBackground: 'transparent',
              colorText: dark ? '#ecebe4' : '#1a1a18',
              colorTextSecondary: dark ? '#a3a199' : '#5c5b55',
              colorInputBackground: 'transparent',
              colorInputText: dark ? '#ecebe4' : '#1a1a18',
              borderRadius: '2px',
              fontFamily: "'Archivo', system-ui, sans-serif",
            },
          }}
        />
      </div>
    </SiteAuthShell>
  );
}
