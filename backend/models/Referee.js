const supabase = require('../lib/supabase');

const REF_TABLE = 'referees';
const ADMIN_TABLE = 'admins';

const mapRow = (row, admin) => ({
    _id: row.id,
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    licenseNumber: row.license_number,
    experienceYears: row.experience_years,
    status: row.status,
    addedBy: admin ? { _id: admin.id, username: admin.username } : row.added_by ? { _id: row.added_by } : null,
    createdAt: row.created_at
});

class RefereeQuery {
    constructor() {
        this.populateField = null;
        this.populateSelect = null;
    }

    populate(field, select) {
        this.populateField = field;
        this.populateSelect = select;
        return this.exec();
    }

    async exec() {
        const { data, error } = await supabase.from(REF_TABLE).select('*').order('created_at', { ascending: false });
        if (error) {
            throw new Error(error.message);
        }

        let adminsById = new Map();
        if (this.populateField === 'addedBy') {
            const adminIds = [...new Set((data || []).map((r) => r.added_by).filter(Boolean))];
            if (adminIds.length > 0) {
                const { data: admins, error: adminError } = await supabase
                    .from(ADMIN_TABLE)
                    .select('id, username')
                    .in('id', adminIds);
                if (adminError) {
                    throw new Error(adminError.message);
                }
                adminsById = new Map((admins || []).map((admin) => [admin.id, admin]));
            }
        }

        return (data || []).map((row) => mapRow(row, adminsById.get(row.added_by)));
    }
}

class Referee {
    static async create(payload) {
        const { data, error } = await supabase
            .from(REF_TABLE)
            .insert({
                full_name: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                license_number: payload.licenseNumber,
                experience_years: Number(payload.experienceYears),
                status: payload.status || 'active',
                added_by: payload.addedBy
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return mapRow(data);
    }

    static find() {
        return new RefereeQuery();
    }

    static async findByIdAndUpdate(id, update) {
        const payload = {};
        if (update.fullName !== undefined) payload.full_name = update.fullName;
        if (update.email !== undefined) payload.email = update.email;
        if (update.phone !== undefined) payload.phone = update.phone;
        if (update.licenseNumber !== undefined) payload.license_number = update.licenseNumber;
        if (update.experienceYears !== undefined) payload.experience_years = Number(update.experienceYears);
        if (update.status !== undefined) payload.status = update.status;

        const { data, error } = await supabase
            .from(REF_TABLE)
            .update(payload)
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
            .from(REF_TABLE)
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

module.exports = Referee;
