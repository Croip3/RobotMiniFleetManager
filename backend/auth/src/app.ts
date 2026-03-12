import jwt from 'jsonwebtoken'
import config from "config";
import { getDatasource } from '../../shared/database/datasource.js'
import { Users } from '../../shared/database/entities/Users.js'
import type { TypeOrmConfig } from "../../shared/database/types/database.types.ts";
import bcrypt from 'bcrypt'

import type { Request, Response, NextFunction } from 'express';

interface JwtConfig {
    private_secret: string;
    public_secret: string;
    expiration_min: number;
}

interface EncryptConfig {
    saltRounds: number;
}

const configJWT = config.get<JwtConfig>("jwt");
const configEncrypt = config.get<EncryptConfig>("encrypt");

export const hashPassword = async (pwd: string) => {
    const hash = await bcrypt.hash(pwd, configEncrypt.saltRounds)
    return hash
}

export const authenticate = async (email: string, pwd: string) => {
    const user = await getUserByEmail(email)
    if (!user) return {success: false, error: 'Invalid credentials'}

    const correctPassword = await bcrypt.compare(pwd, user.password_hash)
    if (!correctPassword) return {success: false, error: 'Invalid credentials'}

    const payload = {
        userId: user.id,
        email: user.email
    }
    const options: jwt.SignOptions = {
        algorithm: 'RS256',
        expiresIn: (configJWT.expiration_min || 2) * 60 // min to seconds
    }

    try {
        const token = jwt.sign(payload, configJWT.private_secret, options)
        console.log(jwt.verify(token, configJWT.public_secret, { algorithms: ["RS256"] }))
        return {success: true, token: token}
    } catch (err) {
        console.error(err)
        return {success: false, error: err}
    }
}

export const getUserByEmail = async (email: string) => {
    const configData = config.get<TypeOrmConfig>("db");
    const datasource = getDatasource(configData)
    await datasource.initialize()
    const usersRepo = datasource.getRepository(Users)

    const user = await usersRepo.findOneBy({email: email})
    await datasource.destroy()

    return user
}