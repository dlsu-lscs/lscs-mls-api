import { Request, Response } from 'express';
import * as ArchersHubService from 'services/archershub.service.js';

export async function getCampuses(req: Request, res: Response) {
    try {
        const campuses = await ArchersHubService.getCampuses();
        res.status(200).json(campuses);
    } catch (err: any) {
        if (['No cookie file found.', 'No cookies found.', 'Session ID not found.'].includes(err.message)) {
            res.status(401).json({ message: 'No active session. Run /courses/fetch to authenticate.' });
        } else {
            res.status(500).json({ message: 'Internal server error.' });
        }
    }
}

export async function getTerms(req: Request, res: Response) {
    try {
        const terms = await ArchersHubService.getTerms();
        res.status(200).json(terms);
    } catch (err: any) {
        if (['No cookie file found.', 'No cookies found.', 'Session ID not found.'].includes(err.message)) {
            res.status(401).json({ message: 'No active session. Run /courses/fetch to authenticate.' });
        } else {
            res.status(500).json({ message: 'Internal server error.' });
        }
    }
}
