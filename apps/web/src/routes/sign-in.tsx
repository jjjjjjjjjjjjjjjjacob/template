import { SignIn } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';
import { SiteAuthShell } from '@/components/site/auth-shell';
import { useSiteVisuals } from '@/components/site/visual-provider';

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  const { theme } = useSiteVisuals();
  const dark = theme === 'dark';

  return (
    <SiteAuthShell
      eyebrow="private route / admin"
      title="Admin sign in"
      description="Authenticate with the account assigned to this portfolio's control room."
    >
      <div className="site-auth-clerk site-auth-clerk-sign-in">
        <SignIn
          path="/sign-in"
          routing="path"
          fallbackRedirectUrl="/admin"
          withSignUp={false}
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
            elements: {
              footerAction: 'hidden',
            },
          }}
        />
      </div>
    </SiteAuthShell>
  );
}
