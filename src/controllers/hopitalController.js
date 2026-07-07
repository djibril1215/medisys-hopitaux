const axios = require('axios');
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

// Creer un transfert - reserve aux medecins, et uniquement pour un patient de LEUR PROPRE hopital
const createTransfert = async (req, res) => {
  const { patient_id, hopital_destination_id, motif } = req.body;
  const hopital_source_id = req.user.hopital_id;
  const token = req.headers['authorization'].split(' ')[1];

  if (!patient_id || !hopital_destination_id) {
    return res.status(400).json({ message: 'patient_id et hopital_destination_id sont requis.' });
  }

  if (hopital_destination_id == hopital_source_id) {
    return res.status(400).json({ message: 'L\'hopital de destination doit etre different de votre hopital.' });
  }

  try {
    // Recuperation du patient via la route interne (le patient doit appartenir a l'hopital du medecin)
    const patientResponse = await axios.get(
      `${process.env.PATIENTS_SERVICE_URL}/api/patients/internal/${patient_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const donneesPatient = patientResponse.data.patient;

    if (donneesPatient.hopital_id !== hopital_source_id) {
      return res.status(403).json({
        message: "Vous ne pouvez transferer que les patients de votre propre etablissement.",
      });
    }

    const newTransfert = await pool.query(
      `INSERT INTO transferts (patient_id, hopital_source_id, hopital_destination_id, motif, donnees_patient)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patient_id, hopital_source_id, hopital_destination_id, motif, donneesPatient]
    );

    res.status(201).json({ message: 'Transfert créé avec succès.', transfert: newTransfert.rows[0] });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Patient non trouvé.' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Erreur serveur lors de la création du transfert.' });
  }
};

const getAllTransferts = async (req, res) => {
  const hopital_id = req.user.hopital_id;
  try {
    const result = await pool.query(
      'SELECT * FROM transferts WHERE hopital_source_id = $1 OR hopital_destination_id = $1 ORDER BY created_at DESC',
      [hopital_id]
    );
    res.status(200).json({ transferts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération.' });
  }
};

// Valider un transfert - reserve au medecin de l'hopital DESTINATAIRE, avec decision explicite
const validerTransfert = async (req, res) => {
  const { id } = req.params;
  const { mode_reprise } = req.body; // 'continuer' ou 'nouveau_dossier'
  const token = req.headers['authorization'].split(' ')[1];

  if (!['continuer', 'nouveau_dossier'].includes(mode_reprise)) {
    return res.status(400).json({ message: "mode_reprise doit valoir 'continuer' ou 'nouveau_dossier'." });
  }

  try {
    const transfertResult = await pool.query('SELECT * FROM transferts WHERE id = $1', [id]);
    const transfert = transfertResult.rows[0];

    if (!transfert) {
      return res.status(404).json({ message: 'Transfert non trouvé.' });
    }

    if (transfert.hopital_destination_id !== req.user.hopital_id) {
      return res.status(403).json({
        message: "Seul un medecin de l'hopital destinataire peut valider ce transfert.",
      });
    }

    if (transfert.statut === 'accepte') {
      return res.status(409).json({ message: 'Ce transfert a deja ete valide.' });
    }

    const d = transfert.donnees_patient;
    const nouveauPatient = {
      nom: d.nom,
      prenom: d.prenom,
      date_naissance: d.date_naissance,
      sexe: d.sexe,
      telephone: d.telephone,
      adresse: d.adresse,
      antecedents_medicaux: mode_reprise === 'continuer' ? d.antecedents_medicaux : null,
      allergies: mode_reprise === 'continuer' ? d.allergies : null,
    };

    // Creation du patient dans l'hopital destinataire (le token du medecin destinataire porte deja le bon hopital_id)
    await axios.post(
      `${process.env.PATIENTS_SERVICE_URL}/api/patients`,
      nouveauPatient,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const result = await pool.query(
      `UPDATE transferts SET statut = 'accepte', mode_reprise = $1 WHERE id = $2 RETURNING *`,
      [mode_reprise, id]
    );

    res.status(200).json({ message: 'Transfert accepté et dossier cree dans votre etablissement.', transfert: result.rows[0] });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erreur serveur lors de la validation.' });
  }
};

module.exports = {
  createHopital, getAllHopitaux, getHopitalById, updateHopital, deleteHopital,
  createTransfert, getAllTransferts, validerTransfert,
};
