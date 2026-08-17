"use strict";
const supabase = require('../lib/supabase');
const TABLE = 'players';
// Helper function to calculate age category from date of birth
const calculateAgeCategory = (dateOfBirth) => {
    if (!dateOfBirth)
        return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    // Adjust age if birthday hasn't occurred this year yet
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    // Determine age category based on age
    if (age < 18)
        return 'U18';
    if (age < 20)
        return 'U20';
    if (age < 23)
        return 'U23';
    return 'Senior';
};
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
    registrationDate: row.registration_date,
    joiningYear: row.joining_year,
    matchesPlayed: row.matches_played || 0,
    goals: row.goals || 0,
    assists: row.assists || 0,
    goalsConceded: row.goals_conceded || 0,
    cleanSheets: row.clean_sheets || 0,
    inStats: row.in_stats || false,
    password: row.password
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
        this.joiningYear = row.joining_year;
        this.matchesPlayed = row.matches_played || 0;
        this.goals = row.goals || 0;
        this.assists = row.assists || 0;
        this.goalsConceded = row.goals_conceded || 0;
        this.cleanSheets = row.clean_sheets || 0;
        this.inStats = row.in_stats || false;
        this.password = row.password;
    }
    async save() {
        const { data, error } = await supabase
            .from(TABLE)
            .update({
            status: this.status,
            access_pass: this.accessPass,
            age_category: this.ageCategory, // Allow manual override
            matches_played: this.matchesPlayed,
            goals: this.goals,
            assists: this.assists,
            goals_conceded: this.goalsConceded,
            clean_sheets: this.cleanSheets,
            in_stats: this.inStats
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
        if (this.filter.inStats !== undefined) {
            query = query.eq('in_stats', this.filter.inStats);
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
        // Auto-calculate age category from date of birth if not provided
        let ageCategory = payload.ageCategory;
        if (!ageCategory && payload.dateOfBirth) {
            ageCategory = calculateAgeCategory(payload.dateOfBirth);
        }
        const basePayload = {
            full_name: payload.fullName,
            email: payload.email || null,
            phone: payload.phone || null,
            positions: payload.positions,
            profile_photo: payload.profilePhoto || null,
            status: payload.status || 'pending',
            age_category: ageCategory, // Use auto-calculated or manually provided value
            matches_played: payload.matchesPlayed !== undefined ? payload.matchesPlayed : 0,
            goals: payload.goals !== undefined ? payload.goals : 0,
            assists: payload.assists !== undefined ? payload.assists : 0,
            goals_conceded: payload.goalsConceded !== undefined ? payload.goalsConceded : 0,
            clean_sheets: payload.cleanSheets !== undefined ? payload.cleanSheets : 0
        };
        if (payload.dateOfBirth !== undefined) {
            basePayload.date_of_birth = payload.dateOfBirth;
        }
        if (payload.joiningYear !== undefined) {
            basePayload.joining_year = Number(payload.joiningYear);
        }
        let result = await supabase.from(TABLE).insert(basePayload).select().single();
        // Backward compatibility when DB migration has not been applied yet.
        if (result.error && result.error.message.includes('age_category')) {
            const { age_category, ...payloadWithoutCategory } = basePayload;
            result = await supabase.from(TABLE).insert(payloadWithoutCategory).select().single();
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
        if (update.status !== undefined)
            fields.status = update.status;
        if (update.accessPass !== undefined)
            fields.access_pass = update.accessPass;
        if (update.profilePhoto !== undefined)
            fields.profile_photo = update.profilePhoto;
        if (update.ageCategory !== undefined)
            fields.age_category = update.ageCategory;
        if (update.matchesPlayed !== undefined)
            fields.matches_played = update.matchesPlayed;
        if (update.goals !== undefined)
            fields.goals = update.goals;
        if (update.assists !== undefined)
            fields.assists = update.assists;
        if (update.goalsConceded !== undefined)
            fields.goals_conceded = update.goalsConceded;
        if (update.cleanSheets !== undefined)
            fields.clean_sheets = update.cleanSheets;
        if (update.inStats !== undefined)
            fields.in_stats = update.inStats;
        if (update.password !== undefined)
            fields.password = update.password;
        // If date of birth is being updated, auto-update age category unless explicitly provided
        if (update.dateOfBirth !== undefined) {
            fields.date_of_birth = update.dateOfBirth;
            if (update.ageCategory === undefined) {
                fields.age_category = calculateAgeCategory(update.dateOfBirth);
            }
        }
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
    // Helper method to recalculate age category for all players or a specific player
    static async recalculateAgeCategory(playerId = null) {
        const query = supabase.from(TABLE).select('*');
        if (playerId) {
            query.eq('id', playerId);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(error.message);
        }
        const updates = [];
        for (const player of data) {
            if (player.date_of_birth) {
                const newCategory = calculateAgeCategory(player.date_of_birth);
                if (newCategory !== player.age_category) {
                    updates.push({
                        id: player.id,
                        age_category: newCategory
                    });
                }
            }
        }
        if (updates.length > 0) {
            // Batch update
            for (const update of updates) {
                await supabase
                    .from(TABLE)
                    .update({ age_category: update.age_category })
                    .eq('id', update.id);
            }
        }
        return updates.length;
    }
}
module.exports = Player;
