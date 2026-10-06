import { useIsMobile } from '@/hooks';
import MobileLayout from './MobileLayout';
import { WebLayout } from './WebLayout';

// Two layouts: an app-style one for phones, and a top-nav one for desktop/tablet
export default function Layout() {
  return useIsMobile() ? <MobileLayout /> : <WebLayout />;
}
