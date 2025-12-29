import { forwardRef } from 'react';

export const SaveButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  return (
    <button
      ref={ref}
      // this makes it so the button takes focus on clicks in safari I can't
      // remember if this is the proper workaround or not, it's been a while!
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#clicking_and_focus
      // https://bugs.webkit.org/show_bug.cgi?id=22261
      tabIndex={0}
      {...props}
      className="bg-primary hover:bg-primary/90 focus-visible:ring-ring rounded-lg p-2 text-left text-sm font-light text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    />
  );
});
