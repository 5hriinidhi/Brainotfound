import { developmentTemplates } from "../questionBank/development/templates.js";
import { cybersecurityTemplates } from "../questionBank/cybersecurity/templates.js";

export function generateQuestion(skill, difficulty) {

    let pool;

    if (skill === "development") {
        pool = developmentTemplates;
    } 
    else if (skill === "cybersecurity") {
        pool = cybersecurityTemplates;
    } 
    else {
        pool = [...developmentTemplates, ...cybersecurityTemplates];
    }

    const available = pool.filter(t => t.difficulty === difficulty);

    const template =
        available[Math.floor(Math.random() * available.length)];

    return template.generate();
}