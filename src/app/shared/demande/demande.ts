import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';




type LeadForm = {
  company: string;
  phone: string;
  bikes: number | null;
  email: string;
  firstName: string;
  lastName: string;
  siret: string;
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
    company: '',
    phone: '',
    bikes: null,
    email: '',
    firstName: '',
    lastName: '',
    siret: '',
    terms: false,
  };

  constructor(private http: HttpClient) { }

  async submit(form: any) {
    // bouton toujours cliquable, même si incomplet
    this.sending = true;
    this.errorMsg = '';

    const payload = {
      access_key: '4def483f-ea91-4f67-85bf-55a98045b890',  // <-- remplace !
      subject: 'Nouvelle demande vélo cargo',
      from_name: this.model.firstName + ' ' + this.model.lastName,
      // Contenu du message (tu peux ajuster le format)
      message: `
Entreprise : ${this.model.company}
Téléphone : ${this.model.phone}
Email : ${this.model.email}
Prénom : ${this.model.firstName}
Nom : ${this.model.lastName}
SIRET : ${this.model.siret}
Nb vélos : ${this.model.bikes ?? ''}
CGU acceptées : ${this.model.terms ? 'oui' : 'non'}
      `.trim(),
      // Champs additionnels en clair si tu veux les retrouver séparément
      company: this.model.company,
      phone: this.model.phone,
      email: this.model.email,
      firstName: this.model.firstName,
      lastName: this.model.lastName,
      siret: this.model.siret,
      bikes: String(this.model.bikes ?? ''),
      terms: this.model.terms ? 'yes' : 'no',
    };

    try {
      const res: any = await this.http
        .post('https://api.web3forms.com/submit', payload)
        .toPromise();

      if (res?.success) {
        this.sent = true;
        // option: form.resetForm();
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
