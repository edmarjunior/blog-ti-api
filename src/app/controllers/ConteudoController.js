import axios from 'axios';
import { addHours } from 'date-fns';

import Conteudo from "../models/Conteudo";
import AcessoConteudo from "../models/AcessoConteudo";
import CurtidaConteudo from "../models/CurtidaConteudo";
import Usuario from "../models/Usuario";

class ConteudoController {
    async index(req, res) {
        const conteudos = await Conteudo.findAll();
        return res.json(conteudos);
    }

    async show(req, res) {
        const { id } = req.params;

        let conteudo = await Conteudo.findByPk(id);

        if (conteudo == null) {
            return res.status(401).json({ message: 'Conteúdo não encontrado' });
        }

        conteudo = conteudo.dataValues;

        conteudo.quantidade_curtidas = await CurtidaConteudo.count({
            where: { conteudo_id: id }
        });

        const { idUsuario } = req.query;

        const possuiUsuario = !!idUsuario && await Usuario.findByPk(idUsuario);



        if (!possuiUsuario) {
            conteudo.isCurtido = false;
        } else {
            const curtida = await CurtidaConteudo.findOne({ 
                where: {
                    usuario_id: idUsuario,
                    conteudo_id: id
                }
            });

            conteudo.curtido = !!curtida;
        }

        conteudo.quantidade_acessos = await AcessoConteudo.count({ where: { conteudo_id: id }});

        const { ip } = req.headers;

        if (!ip || ip === '189.41.145.160' || ip === '177.11.188.2') {
            return res.json(conteudo);
        }

        const ultimoAcesso = await AcessoConteudo.findOne({ 
            where: { ip }, 
            order: [
                ['data', 'DESC']
            ]
        });

        if (ultimoAcesso?.data) {
            const dataValidaNovoAcesso = addHours(ultimoAcesso.data, 1);

            if (new Date() < dataValidaNovoAcesso) {
                return res.json(conteudo);
            }
        }

        const response = await axios.get(`http://ip-api.com/json/${ip}`)

        const { countryCode, region, city, lat, lon } = response.data;

        // gravando acesso
        await AcessoConteudo.create({
            conteudo_id: id,
            localizacao: JSON.stringify({ countryCode, region, city, lat, lon }),
            data: new Date(),
            ip,
            usuario_id: possuiUsuario ? idUsuario : null
        });

        conteudo.quantidade_acessos++;

        return res.json(conteudo);
    }
}

export default new ConteudoController();
