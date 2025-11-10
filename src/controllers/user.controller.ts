import { Request, Response } from "express";
import * as UserService from 'services/user.service.js';

export async function createUser(req: Request, res: Response) {
    try {
        const user = await UserService.createUser(req.body);
        if (!user) {
            return res.status(409).json({ message: 'User already exists.' });
        }
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error creating tournament.', error: err });
    }
}

export async function getAllUsers(req: Request, res: Response) {
    try {
        const users = await UserService.getAllUsers();
        res.status(200).json(users);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error fetching all users.', error: err });
    }
}

export async function getUserById(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const user = await UserService.getUserById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error fetching user.', error: err });
    }
}

export async function updateUser(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        // Prevent updating with an empty object
		if (Object.keys(req.body).length === 0) {
			return res.status(400).json({ message: 'No update fields provided.' });
		}

        const user = await UserService.updateUser(id, req.body);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error updating user.', error: err });
    }
}

export async function updateUserIdNumber(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const idNumber = Number(req.body.idNumber);
        if (isNaN(id) || isNaN(idNumber)) {
            return res.status(400).json({ message: 'Invalid id.' });
        }

        const success = await UserService.updateUserIdNumber(id, idNumber);

        if (!success) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ idNumber: idNumber })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error updating user ID number.', error: err });
    }
}

export async function deleteUser(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const success = await UserService.deleteUser(id);

        if (!success) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ message: 'User deleted successfully.' })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error deleting user.', error: err });
    }
}