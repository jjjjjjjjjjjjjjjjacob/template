export function SiteFooter() {
  return (
    <footer className="bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground text-sm font-light">
            © {new Date().getFullYear()} jacob stein
          </p>
          <div className="text-muted-foreground flex items-center gap-4 text-sm font-light">
            <a
              href="#projects"
              className="hover:text-foreground transition-colors duration-200"
            >
              projects
            </a>
            <a
              href="#resume"
              className="hover:text-foreground transition-colors duration-200"
            >
              resume
            </a>
            <a
              href="#contact"
              className="hover:text-foreground transition-colors duration-200"
            >
              contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
