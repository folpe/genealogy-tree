// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RightsNoticeBox } from './rights-notice';

describe('RightsNoticeBox', () => {
  it('dit la règle calculée par le serveur, puce à l’encre en direct', () => {
    const { container } = render(
      <RightsNoticeBox
        notice={{ tone: 'direct', text: 'Dans ta lignée : tu modifies directement.' }}
      />,
    );
    expect(screen.getByText('Dans ta lignée : tu modifies directement.')).toBeVisible();
    expect(container.querySelector('[data-tone]')).toHaveAttribute('data-tone', 'direct');
  });

  it('marque la suggestion en accent', () => {
    const { container } = render(
      <RightsNoticeBox
        notice={{ tone: 'suggest', text: 'Hors de ta lignée : ta suggestion ira à Isabelle.' }}
      />,
    );
    expect(container.querySelector('[data-tone]')).toHaveAttribute('data-tone', 'suggest');
  });

  it('ne rend rien sans encart', () => {
    const { container } = render(<RightsNoticeBox notice={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
