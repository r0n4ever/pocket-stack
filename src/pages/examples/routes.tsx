import { Route } from 'react-router-dom';
import { ExampleDashboard } from './Dashboard';
import { ExampleTable } from './Table';
import { ExampleCard } from './Card';
import { Form } from './Form';
import { Blank } from './Blank';

export const ExampleRoutes = (
  <>
    <Route path="examples/blank" element={<Blank />} />
    <Route path="examples/dashboard" element={<ExampleDashboard />} />
    <Route path="examples/table" element={<ExampleTable />} />
    <Route path="examples/card" element={<ExampleCard />} />
    <Route path="examples/form" element={<Form />} />
  </>
);
