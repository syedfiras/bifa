const supabase = require('../lib/supabase');

const TABLE = 'attendance';

const mapRow = (row) => ({
    _id: row.id,
    id: row.id,
    playerId: row.player_id,
    practiceDate: row.practice_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

class Attendance {
    static async upsert(playerId, practiceDate, status) {
        const { data, error } = await supabase
            .from(TABLE)
            .upsert({ player_id: playerId, practice_date: practiceDate, status }, { onConflict: 'player_id,practice_date' })
            .select()
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }
        return data ? mapRow(data) : null;
    }

    static async findByDate(practiceDate) {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('practice_date', practiceDate);

        if (error) {
            throw new Error(error.message);
        }
        return (data || []).map(mapRow);
    }

    static async findByPlayer(playerId) {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('player_id', playerId)
            .order('practice_date', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }
        return (data || []).map(mapRow);
    }
}

module.exports = Attendance;
