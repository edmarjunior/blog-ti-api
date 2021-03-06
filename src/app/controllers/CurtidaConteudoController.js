import CurtidaConteudo from "../models/CurtidaConteudo";
import Usuario from "../models/Usuario";

class CurtidaConteudoController {
    async store(req, res) {
        const { idConteudo } = req.params;

        const curtidaAnterior = await CurtidaConteudo.findOne({
            where: { 
                usuario_id: req.idUsuario,
                conteudo_id: idConteudo,
            }
        });

        if (curtidaAnterior) {
            return res.json({ 
                ...curtidaAnterior.dataValues,
                curtido_anteriormente: true,  
                msg: 'Este conteúdo já estava curtido, obrigado!'
            });
        }

        const curtida = await CurtidaConteudo.create({
            usuario_id: req.idUsuario,
            conteudo_id: idConteudo,
        });

        return res.json(curtida);
    }
}

export default new CurtidaConteudoController();
