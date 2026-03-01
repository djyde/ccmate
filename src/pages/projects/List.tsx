import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClaudeProjects } from "../../lib/query";

export function List() {
	const navigate = useNavigate();
	const { data: projects } = useClaudeProjects();

	useEffect(() => {
		if (projects && projects.length > 0) {
			const firstProjectPath = encodeURIComponent(projects[0].path);
			navigate(`/projects/${firstProjectPath}`, { replace: true });
		}
	}, [projects, navigate]);

	return null;
}
