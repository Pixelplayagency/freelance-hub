-- Freelancers could previously only see a project if they had a task assigned
-- to them in it. Admin wants every freelancer to browse every project by
-- default, whether or not they currently have work in it.
DROP POLICY IF EXISTS "Freelancers see their projects" ON public.projects;

CREATE POLICY "Freelancers see all projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'freelancer'
    )
  );
