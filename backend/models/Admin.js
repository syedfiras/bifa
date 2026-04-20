const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');

const TABLE = 'admins';

class AdminRecord {
    constructor(row) {
        this._id = row.id;
        this.id = row.id;
        this.username = row.username;
        this.password = row.password;
        this.createdAt = row.created_at;
    }

    async matchPassword(enteredPassword) {
        return bcrypt.compare(enteredPassword, this.password);
    }

    async save() {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        const { data, error } = await supabase
            .from(TABLE)
            .update({ password: hashedPassword })
            .eq('id', this.id)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return new AdminRecord(data);
    }
}

class Admin {
    static async findOne(filter) {
        let query = supabase.from(TABLE).select('*');
        if (filter && filter.username) {
            query = query.eq('username', filter.username);
        }
        const { data, error } = await query.limit(1).maybeSingle();
        if (error) {
            throw new Error(error.message);
        }
        return data ? new AdminRecord(data) : null;
    }

    static async findById(id) {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        return data ? new AdminRecord(data) : null;
    }

    static async create(payload) {
        const hashedPassword = await bcrypt.hash(payload.password, 10);
        const { data, error } = await supabase
            .from(TABLE)
            .insert({
                username: payload.username,
                password: hashedPassword
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return new AdminRecord(data);
    }
}

module.exports = Admin;
