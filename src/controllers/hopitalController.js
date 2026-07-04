const pool = require('../config/db');

const createHopital = async (req, res) => {
  const { nom, adresse, ville, telephone, specialites, capacite_lits } = req.body;

  if (!nom) {
    return res.status(400).json({ message: 'Le nom de l\'hôpital est requis.' });
  }

  try {
    const newHopital = await pool.query(
      `INSERT INTO hopitaux (nom, adresse, ville, telephone, specialites, capacite_lits)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nom, adresse, ville, telephone, specialites, capacite_lits]
    );

    res.status(201).json({ message: 'Hôpital créé avec succès.', hopital: newHopital.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la création.' });
  }
};

const getAllHopitaux = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hopitaux ORDER BY nom ASC');
    res.status(200).json({ hopitaux: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération.' });
  }
};

const getHopitalById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM hopitaux WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hôpital non trouvé.' });
    }

    res.status(200).json({ hopital: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateHopital = async (req, res) => {
  const { id } = req.params;
  const { nom, adresse, ville, telephone, specialites, capacite_lits } = req.body;

  try {
    const result = await pool.query(
      `UPDATE hopitaux SET nom = $1, adresse = $2, ville = $3, telephone = $4,
       specialites = $5, capacite_lits = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [nom, adresse, ville, telephone, specialites, capacite_lits, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hôpital non trouvé.' });
    }

    res.status(200).json({ message: 'Hôpital mis à jour avec succès.', hopital: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour.' });
  }
};

const deleteHopital = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM hopitaux WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hôpital non trouvé.' });
    }

    res.status(200).json({ message: 'Hôpital supprimé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression.' });
  }
};

// Créer un transfert de patient vers un autre hôpital
const createTransfert = async (req, res) => {
  const { patient_id, hopital_source_id, hopital_destination_id, motif } = req.body;

  if (!patient_id || !hopital_source_id || !hopital_destination_id) {
    return res.status(400).json({ message: 'patient_id, hopital_source_id et hopital_destination_id sont requis.' });
  }

  try {
    const newTransfert = await pool.query(
      `INSERT INTO transferts (patient_id, hopital_source_id, hopital_destination_id, motif)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [patient_id, hopital_source_id, hopital_destination_id, motif]
    );

    res.status(201).json({ message: 'Transfert créé avec succès.', transfert: newTransfert.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la création du transfert.' });
  }
};

const getAllTransferts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transferts ORDER BY created_at DESC');
    res.status(200).json({ transferts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération.' });
  }
};

module.exports = {
  createHopital, getAllHopitaux, getHopitalById, updateHopital, deleteHopital,
  createTransfert, getAllTransferts,
};
