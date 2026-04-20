const supabase = require('../lib/supabase');

const TABLE = 'players';

const mapRow = (row) => ({
    _id: row.id,
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    positions: row.positions || [],
    ageCategory: row.age_category,
    profilePhoto: row.profile_photo,
    status: row.status,
    accessPass: row.access_pass,
    registrationDate: row.registration_date
});

class PlayerRecord {
    constructor(row) {
        this._id = row.id;
        this.id = row.id;
        this.fullName = row.full_name;
        this.email = row.email;
        this.phone = row.phone;
        this.dateOfBirth = row.date_of_birth;
        this.positions = row.positions || [];
        this.ageCategory = row.age_category;
        this.profilePhoto = row.profile_photo;
        this.status = row.status;
        this.accessPass = row.access_pass;
        this.registrationDate = row.registration_date;
    }

    async save() {
        const { data, error } = await supabase
            .from(TABLE)
            .update({
                status: this.status,
                access_pass: this.accessPass
            })
            .eq('id', this.id)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return new PlayerRecord(data);
    }
}

class PlayerQuery {
    constructor(filter = {}) {
        this.filter = filter;
        this.sortField = 'registration_date';
        this.sortAscending = false;
    }

    sort(sortExpr) {
        if (sortExpr === '-registrationDate') {
            this.sortField = 'registration_date';
            this.sortAscending = false;
        }
        return this.exec();
    }

    async exec() {
        let query = supabase.from(TABLE).select('*');

        if (this.filter.status) {
            query = query.eq('status', this.filter.status);
        }

        if (this.filter.positions && Array.isArray(this.filter.positions.$in) && this.filter.positions.$in.length > 0) {
            query = query.contains('positions', this.filter.positions.$in);
        }
        if (this.filter.ageCategory) {
            query = query.eq('age_category', this.filter.ageCategory);
        }

        const { data, error } = await query.order(this.sortField, { ascending: this.sortAscending });
        if (error) {
            throw new Error(error.message);
        }

        return (data || []).map(mapRow);
    }
}

class Player {
    static async create(payload) {
        const basePayload = {
            full_name: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            date_of_birth: payload.dateOfBirth,
            positions: payload.positions,
            profile_photo: payload.profilePhoto || null,
            status: 'pending'
        };

        const withCategoryPayload = { ...basePayload, age_category: payload.ageCategory };
        let result = await supabase.from(TABLE).insert(withCategoryPayload).select().single();

        // Backward compatibility when DB migration has not been applied yet.
        if (result.error && result.error.message.includes('age_category')) {
            result = await supabase.from(TABLE).insert(basePayload).select().single();
        }

        if (result.error) {
            throw new Error(result.error.message);
        }

        return mapRow(result.data);
    }

    static find(filter) {
        return new PlayerQuery(filter);
    }

    static async findById(id) {
        const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
        if (error) {
            throw new Error(error.message);
        }
        return data ? new PlayerRecord(data) : null;
    }

    static async findByIdAndUpdate(id, update, _options = {}) {
        const fields = {};
        if (update.status !== undefined) fields.status = update.status;
        if (update.accessPass !== undefined) fields.access_pass = update.accessPass;
        if (update.profilePhoto !== undefined) fields.profile_photo = update.profilePhoto;

        const { data, error } = await supabase
            .from(TABLE)
            .update(fields)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }
        return data ? mapRow(data) : null;
    }

    static async findByIdAndDelete(id) {
        const { data, error } = await supabase
            .from(TABLE)
            .delete()
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }
        return data ? mapRow(data) : null;
    }
}

module.exports = Player;
