import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

type LeadForm = {
  firstName: string;
  lastName: string;

  phone: string;
  email: string;

  company: string;
  siret: string;

  deliveryAddress: string;
  postcode: string;
  city: string;

  employees: number | null;
  terms: boolean;
};

@Component({
  selector: 'ceg-demande',
  imports: [RouterModule, FormsModule, NgIf],
  templateUrl: './demande.html',
  styleUrl: './demande.scss'
})
export class Demande {
  sent = false;
  sending = false;
  errorMsg = '';

  model: LeadForm = {
    firstName: '',
    lastName: '',

    phone: '',
    email: '',

    company: '',
    siret: '',

    deliveryAddress: '',
    postcode: '',
    city: '',

    employees: null,
    terms: false,
  };

  constructor(private http: HttpClient) {}

  async submit(form: any) {
    this.sending = true;
    this.errorMsg = '';

    const employees = Number(this.model.employees ?? 0);
    const bikes = employees; // 1 employé = 1 vélo

    const payload = {
      access_key: '4def483f-ea91-4f67-85bf-55a98045b890', // <-- remplace par ta clé
      subject: 'Nouvelle demande vélo cargo',
      from_name: `${this.model.firstName} ${this.model.lastName}`,

      // Message texte (lisible dans l’email reçu)
      message: `
Prénom : ${this.model.firstName}
Nom : ${this.model.lastName}

Téléphone : ${this.model.phone}
Email : ${this.model.email}

Entreprise : ${this.model.company}
SIRET : ${this.model.siret}

Adresse de livraison : ${this.model.deliveryAddress}
${this.model.postcode} ${this.model.city}

Employés éligibles : ${employees}
Vélos demandés (calcul) : ${bikes}

CGU acceptées : ${this.model.terms ? 'oui' : 'non'}
      `.trim(),

      // Champs structurés (facile à parser côté réception)
      firstName: this.model.firstName,
      lastName: this.model.lastName,

      phone: this.model.phone,
      email: this.model.email,

      company: this.model.company,
      siret: this.model.siret,

      deliveryAddress: this.model.deliveryAddress,
      postcode: this.model.postcode,
      city: this.model.city,

      employees: String(employees),
      bikes: String(bikes),
      terms: this.model.terms ? 'yes' : 'no',
    };

    try {
      const res: any = await this.http
        .post('https://api.web3forms.com/submit', payload)
        .toPromise();

      if (res?.success) {
        this.sent = true;
        // form.resetForm(); // <- tu peux activer ça si tu veux vider le formulaire après envoi
      } else {
        this.errorMsg = "Une erreur est survenue lors de l'envoi.";
      }
    } catch (e) {
      this.errorMsg = "Impossible d'envoyer la demande pour le moment.";
      console.error(e);
    } finally {
      this.sending = false;
    }
  }
}
