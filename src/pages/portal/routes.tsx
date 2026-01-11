import { Route } from 'react-router-dom';
import { BlogDetail } from './BlogDetail';

export const PortalRoutes = (
    <>
        <Route path="portal/blog-detail" element={<BlogDetail />} />
    </>
);
